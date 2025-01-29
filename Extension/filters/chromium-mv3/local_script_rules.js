/**
 * By the rules of Chrome Web Store, we cannot use remote scripts.
 *    Because of that, we use the following approach
 *    (you can search the described steps by 'JS_RULES_EXECUTION' in the bundled background.js):
 *
 * 1. We collect and pre-build script rules from the filters (which are pre-built into the extension)
 *    into the add-on (STEP 1.1 and 1.2). See 'updateLocalResourcesForChromiumMv3' in
 *    https://github.com/AdguardTeam/AdguardBrowserExtension/blob/release/mv3-filters/tools/resources/update-local-script-rules.ts
 *    and the files called "local_script_rules.js".
 * 2. Collected local scripts are passed to the engine (STEP 2.1 and 2.2).
 * 3. At runtime we check every script rule whether it is included in "local_script_rules.js" (STEP 3).
 * 4. Execution of script rules:
 *     - If the rule is included, we allow this rule to be executed.
 *       Such rules are executed by chrome.scripting API (STEP 4.1 and 4.2). Other rules are discarded.
 */
export const localScriptRules = {
    '(function(){var a=document.currentScript,b=String.prototype.charCodeAt,c=function(){return true;};Object.defineProperty(String.prototype,"charCodeAt",{get:function(){return document.currentScript===a?b:c},set:function(a){}})})();': {
        uniqueId: "a415b8ebbf930b083a9d813bb1a1367a",
        func: () => {
            try {
                const t = "done";
                if (Window.prototype.toString.a415b8ebbf930b083a9d813bb1a1367a !== t) {
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
                }
            } catch (t) {
                console.error('Error executing AG js rule with uniqueId "a415b8ebbf930b083a9d813bb1a1367a" due to: ' + t);
            }
        }
    },
    "(function() { var isSet = false; Object.defineProperty(window, 'vas', { get: function() { return isSet ? false : undefined; }, set: function() { isSet = false; } }); })();": {
        uniqueId: "d818588d2f70a2feaf95e6d52f17ccbe",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.d818588d2f70a2feaf95e6d52f17ccbe !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "d818588d2f70a2feaf95e6d52f17ccbe" due to: ' + e);
            }
        }
    },
    "window.trckd = true;": {
        uniqueId: "9694a84d652f8dc20c14bac2f5d04885",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["9694a84d652f8dc20c14bac2f5d04885"] !== e) {
                    window.trckd = !0;
                    Object.defineProperty(Window.prototype.toString, "9694a84d652f8dc20c14bac2f5d04885", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "9694a84d652f8dc20c14bac2f5d04885" due to: ' + e);
            }
        }
    },
    "window.ab = false;": {
        uniqueId: "4b8a3a3cee481368c865f50cdb63083f",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["4b8a3a3cee481368c865f50cdb63083f"] !== e) {
                    window.ab = !1;
                    Object.defineProperty(Window.prototype.toString, "4b8a3a3cee481368c865f50cdb63083f", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "4b8a3a3cee481368c865f50cdb63083f" due to: ' + e);
            }
        }
    },
    "window.aadnet = {};": {
        uniqueId: "723ed96afa36adad6fac95f60ddc793d",
        func: () => {
            try {
                const d = "done";
                if (Window.prototype.toString["723ed96afa36adad6fac95f60ddc793d"] !== d) {
                    window.aadnet = {};
                    Object.defineProperty(Window.prototype.toString, "723ed96afa36adad6fac95f60ddc793d", {
                        value: d,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (d) {
                console.error('Error executing AG js rule with uniqueId "723ed96afa36adad6fac95f60ddc793d" due to: ' + d);
            }
        }
    },
    "var isadblock=1;": {
        uniqueId: "0528f2e6eabb867d601e3b5619e18249",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["0528f2e6eabb867d601e3b5619e18249"] !== e) {
                    var isadblock = 1;
                    Object.defineProperty(Window.prototype.toString, "0528f2e6eabb867d601e3b5619e18249", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "0528f2e6eabb867d601e3b5619e18249" due to: ' + e);
            }
        }
    },
    "function setTimeout() {};": {
        uniqueId: "2fe08ac469bce8e0959ec04f0f994427",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["2fe08ac469bce8e0959ec04f0f994427"] !== e) {
                    function setTimeout() {}
                    Object.defineProperty(Window.prototype.toString, "2fe08ac469bce8e0959ec04f0f994427", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (t) {
                console.error('Error executing AG js rule with uniqueId "2fe08ac469bce8e0959ec04f0f994427" due to: ' + t);
            }
        }
    },
    "window.google_jobrunner = function() {};": {
        uniqueId: "59956228dfe006ac6f5c8faa9d7247e2",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["59956228dfe006ac6f5c8faa9d7247e2"] !== e) {
                    window.google_jobrunner = function() {};
                    Object.defineProperty(Window.prototype.toString, "59956228dfe006ac6f5c8faa9d7247e2", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "59956228dfe006ac6f5c8faa9d7247e2" due to: ' + e);
            }
        }
    },
    "var block = false;": {
        uniqueId: "84381f8c4a4c9c214a07baa32a8b8a38",
        func: () => {
            try {
                const a = "done";
                if (Window.prototype.toString["84381f8c4a4c9c214a07baa32a8b8a38"] !== a) {
                    var block = !1;
                    Object.defineProperty(Window.prototype.toString, "84381f8c4a4c9c214a07baa32a8b8a38", {
                        value: a,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (a) {
                console.error('Error executing AG js rule with uniqueId "84381f8c4a4c9c214a07baa32a8b8a38" due to: ' + a);
            }
        }
    },
    "window.setTimeout=function() {};": {
        uniqueId: "61f2a933309703d6e7d9383e4428a8e6",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["61f2a933309703d6e7d9383e4428a8e6"] !== e) {
                    window.setTimeout = function() {};
                    Object.defineProperty(Window.prototype.toString, "61f2a933309703d6e7d9383e4428a8e6", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "61f2a933309703d6e7d9383e4428a8e6" due to: ' + e);
            }
        }
    },
    "var canRunAds = true;": {
        uniqueId: "8a68886c66c8ca4dccac563705f5891c",
        func: () => {
            try {
                const c = "done";
                if (Window.prototype.toString["8a68886c66c8ca4dccac563705f5891c"] !== c) {
                    var canRunAds = !0;
                    Object.defineProperty(Window.prototype.toString, "8a68886c66c8ca4dccac563705f5891c", {
                        value: c,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (c) {
                console.error('Error executing AG js rule with uniqueId "8a68886c66c8ca4dccac563705f5891c" due to: ' + c);
            }
        }
    },
    "Element.prototype.attachShadow = function(){};": {
        uniqueId: "34432d844bc8123e149136a1ccd4dca3",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["34432d844bc8123e149136a1ccd4dca3"] !== e) {
                    Element.prototype.attachShadow = function() {};
                    Object.defineProperty(Window.prototype.toString, "34432d844bc8123e149136a1ccd4dca3", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "34432d844bc8123e149136a1ccd4dca3" due to: ' + e);
            }
        }
    },
    "(function() { var isSet = false; Object.defineProperty(window, 'vPRinfiniteLoopOfChanges', { get: function() { return isSet ? false : undefined; }, set: function() { isSet = false; } }); })();": {
        uniqueId: "bffee78500f54100750c74bab16e37f7",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.bffee78500f54100750c74bab16e37f7 !== e) {
                    !function() {
                        var e = !1;
                        Object.defineProperty(window, "vPRinfiniteLoopOfChanges", {
                            get: function() {
                                return !e && void 0;
                            },
                            set: function() {
                                e = !1;
                            }
                        });
                    }();
                    Object.defineProperty(Window.prototype.toString, "bffee78500f54100750c74bab16e37f7", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "bffee78500f54100750c74bab16e37f7" due to: ' + e);
            }
        }
    },
    "window.atob = function() {};": {
        uniqueId: "1dd67b659846dea638d69419abe06c73",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["1dd67b659846dea638d69419abe06c73"] !== e) {
                    window.atob = function() {};
                    Object.defineProperty(Window.prototype.toString, "1dd67b659846dea638d69419abe06c73", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "1dd67b659846dea638d69419abe06c73" due to: ' + e);
            }
        }
    },
    "window.Worker = function() { this.postMessage = function() {} };": {
        uniqueId: "f9e77f2ee05d700d3205a8848507f6b1",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.f9e77f2ee05d700d3205a8848507f6b1 !== e) {
                    window.Worker = function() {
                        this.postMessage = function() {};
                    };
                    Object.defineProperty(Window.prototype.toString, "f9e77f2ee05d700d3205a8848507f6b1", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "f9e77f2ee05d700d3205a8848507f6b1" due to: ' + e);
            }
        }
    },
    "(function() { var intervalId = 0; var blockAds = function() { try { if (typeof BeSeedRotator != 'undefined' && BeSeedRotator.Container.player) { clearInterval(intervalId); BeSeedRotator.showDismissButton(); BeSeedRotator.reCache(); } } catch (ex) {}  }; intervalId = setInterval(blockAds, 100); })();": {
        uniqueId: "52c186b38202f876b11210bbe1307dcf",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["52c186b38202f876b11210bbe1307dcf"] !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "52c186b38202f876b11210bbe1307dcf" due to: ' + e);
            }
        }
    },
    '(function(){var getElementsByTagName=document.getElementsByTagName;document.getElementsByTagName=function(tagName){if(tagName=="script")return[];return getElementsByTagName.call(this,tagName)}})();': {
        uniqueId: "b1d2d1ecc236da7e56f0c6627c80f309",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.b1d2d1ecc236da7e56f0c6627c80f309 !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "b1d2d1ecc236da7e56f0c6627c80f309" due to: ' + e);
            }
        }
    },
    '(function(){var b={};(function(a,c,d){"undefined"!==typeof window[a]?window[a][c]=d:Object.defineProperty(window,a,{get:function(){return b[a]},set:function(e){b[a]=e;e[c]=d}})})("authConfig","adfox",[])})();': {
        uniqueId: "f08e1e484fb2ed477eff5477b270c3ab",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.f08e1e484fb2ed477eff5477b270c3ab !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "f08e1e484fb2ed477eff5477b270c3ab" due to: ' + e);
            }
        }
    },
    '!function(){const p={apply:(p,e,n)=>{const r=Reflect.apply(p,e,n),s=r?.[0]?.props?.data;return s&&null===s.user&&(r[0].props.data.user="guest"),r}};window.JSON.parse=new Proxy(window.JSON.parse,p)}();': {
        uniqueId: "ff8cf9783100a66d151550ce6ced34a2",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.ff8cf9783100a66d151550ce6ced34a2 !== e) {
                    !function() {
                        const e = {
                            apply: (e, r, o) => {
                                const t = Reflect.apply(e, r, o), n = t?.[0]?.props?.data;
                                return n && null === n.user && (t[0].props.data.user = "guest"), t;
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "ff8cf9783100a66d151550ce6ced34a2" due to: ' + e);
            }
        }
    },
    '(()=>{const a=(a,b,c)=>{const d=Reflect.apply(a,b,c),e="div[id^=\'atf\']:empty { display: none !important; }";if("adoptedStyleSheets"in document){const a=new CSSStyleSheet;a.replaceSync(e),d.adoptedStyleSheets=[a]}else{const a=document.createElement("style");a.innerText=e,d.appendChild(a)}return d};window.Element.prototype.attachShadow=new Proxy(window.Element.prototype.attachShadow,{apply:a})})();': {
        uniqueId: "b8fa834f4adf06d6a85a989a38de37be",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.b8fa834f4adf06d6a85a989a38de37be !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "b8fa834f4adf06d6a85a989a38de37be" due to: ' + e);
            }
        }
    },
    '(()=>{let e="";const a=`GA1.1.${Math.floor(Date.now()/1e3)}.${Math.floor(Date.now()/1e3)}`;let o=!1;const t=()=>{e=e.replace("G-",""),document.cookie=`_ga_${e}=${a}`};window.dataLayer=window.dataLayer||[],dataLayer.push=new Proxy(window.dataLayer.push,{apply:(a,d,n)=>("config"===n[0][0]&&(e=n[0][1],"complete"===document.readyState?t():o||(window.addEventListener("load",t),o=!0)),Reflect.apply(a,d,n))})})();': {
        uniqueId: "705ae313f8102fef541d8350d8376e37",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["705ae313f8102fef541d8350d8376e37"] !== e) {
                    (() => {
                        let e = "";
                        const o = `GA1.1.${Math.floor(Date.now() / 1e3)}.${Math.floor(Date.now() / 1e3)}`;
                        let t = !1;
                        const a = () => {
                            e = e.replace("G-", ""), document.cookie = `_ga_${e}=${o}`;
                        };
                        window.dataLayer = window.dataLayer || [], dataLayer.push = new Proxy(window.dataLayer.push, {
                            apply: (o, r, d) => ("config" === d[0][0] && (e = d[0][1], "complete" === document.readyState ? a() : t || (window.addEventListener("load", a), 
                            t = !0)), Reflect.apply(o, r, d))
                        });
                    })();
                    Object.defineProperty(Window.prototype.toString, "705ae313f8102fef541d8350d8376e37", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "705ae313f8102fef541d8350d8376e37" due to: ' + e);
            }
        }
    },
    "window.samDetected = false;": {
        uniqueId: "c377d77d43a05809c9a0d8a9ceab3d41",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.c377d77d43a05809c9a0d8a9ceab3d41 !== e) {
                    window.samDetected = !1;
                    Object.defineProperty(Window.prototype.toString, "c377d77d43a05809c9a0d8a9ceab3d41", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "c377d77d43a05809c9a0d8a9ceab3d41" due to: ' + e);
            }
        }
    },
    "var _amw1 = 1;": {
        uniqueId: "18c5b42ee23d66b2e421249a57fa79b6",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["18c5b42ee23d66b2e421249a57fa79b6"] !== e) {
                    var _amw1 = 1;
                    Object.defineProperty(Window.prototype.toString, "18c5b42ee23d66b2e421249a57fa79b6", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "18c5b42ee23d66b2e421249a57fa79b6" due to: ' + e);
            }
        }
    },
    "var AdmostClient = 1;": {
        uniqueId: "68f39c1ee25950ec0093a17497f1746a",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["68f39c1ee25950ec0093a17497f1746a"] !== e) {
                    var AdmostClient = 1;
                    Object.defineProperty(Window.prototype.toString, "68f39c1ee25950ec0093a17497f1746a", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "68f39c1ee25950ec0093a17497f1746a" due to: ' + e);
            }
        }
    },
    "var advertisement_not_blocked = 1;": {
        uniqueId: "7d86fff0df182d87d917f92dd5565564",
        func: () => {
            try {
                const d = "done";
                if (Window.prototype.toString["7d86fff0df182d87d917f92dd5565564"] !== d) {
                    var advertisement_not_blocked = 1;
                    Object.defineProperty(Window.prototype.toString, "7d86fff0df182d87d917f92dd5565564", {
                        value: d,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (d) {
                console.error('Error executing AG js rule with uniqueId "7d86fff0df182d87d917f92dd5565564" due to: ' + d);
            }
        }
    },
    "var criteo_medyanet_loaded = 1;": {
        uniqueId: "36a1a7ba76fefd6b56dea5d5a3260cf4",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["36a1a7ba76fefd6b56dea5d5a3260cf4"] !== e) {
                    var criteo_medyanet_loaded = 1;
                    Object.defineProperty(Window.prototype.toString, "36a1a7ba76fefd6b56dea5d5a3260cf4", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "36a1a7ba76fefd6b56dea5d5a3260cf4" due to: ' + e);
            }
        }
    },
    '(function(){var b=window.setTimeout;window.setTimeout=function(a,c){if(!/RTCPeerConnection[\\s\\S]*?new MouseEvent\\("click"/.test(a.toString()))return b(a,c)};})();': {
        uniqueId: "ad3cc2fb594ccbd52529466a1f774118",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.ad3cc2fb594ccbd52529466a1f774118 !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "ad3cc2fb594ccbd52529466a1f774118" due to: ' + e);
            }
        }
    },
    '!function(){if(-1<window.location.href.indexOf("/?u=aHR0c")){var a=location.href.split("/?u=");if(a[1])try{window.location=atob(a[1])}catch(b){}}}();': {
        uniqueId: "8286156f54f298badd47131511830b06",
        func: () => {
            try {
                const o = "done";
                if (Window.prototype.toString["8286156f54f298badd47131511830b06"] !== o) {
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
                }
            } catch (o) {
                console.error('Error executing AG js rule with uniqueId "8286156f54f298badd47131511830b06" due to: ' + o);
            }
        }
    },
    'document.cookie="modalads=yes; path=/;";': {
        uniqueId: "48f46432b0c186dccc332dff0c8a87fe",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["48f46432b0c186dccc332dff0c8a87fe"] !== e) {
                    document.cookie = "modalads=yes; path=/;";
                    Object.defineProperty(Window.prototype.toString, "48f46432b0c186dccc332dff0c8a87fe", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "48f46432b0c186dccc332dff0c8a87fe" due to: ' + e);
            }
        }
    },
    "if(window.sessionStorage) { window.sessionStorage.pageCount = 0; }": {
        uniqueId: "96c1872f8a0322e86045b358d415f5c4",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["96c1872f8a0322e86045b358d415f5c4"] !== e) {
                    window.sessionStorage && (window.sessionStorage.pageCount = 0);
                    Object.defineProperty(Window.prototype.toString, "96c1872f8a0322e86045b358d415f5c4", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "96c1872f8a0322e86045b358d415f5c4" due to: ' + e);
            }
        }
    },
    'setTimeout ("HideFloatAdBanner()", 1000);': {
        uniqueId: "56182d371d85af85aa5af8cbd48e5b34",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["56182d371d85af85aa5af8cbd48e5b34"] !== e) {
                    setTimeout("HideFloatAdBanner()", 1e3);
                    Object.defineProperty(Window.prototype.toString, "56182d371d85af85aa5af8cbd48e5b34", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "56182d371d85af85aa5af8cbd48e5b34" due to: ' + e);
            }
        }
    },
    '!function(){const e={apply:(e,t,n)=>(n&&n[1]&&"useAdBlockerDetector"===n[1]&&n[2]&&n[2].get&&(n[2].get=function(){return function(){return!1}}),Reflect.apply(e,t,n))};window.Object.defineProperty=new Proxy(window.Object.defineProperty,e)}();': {
        uniqueId: "121f6100a828e1c169bfff6bafc69bfd",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["121f6100a828e1c169bfff6bafc69bfd"] !== e) {
                    !function() {
                        const e = {
                            apply: (e, t, o) => (o && o[1] && "useAdBlockerDetector" === o[1] && o[2] && o[2].get && (o[2].get = function() {
                                return function() {
                                    return !1;
                                };
                            }), Reflect.apply(e, t, o))
                        };
                        window.Object.defineProperty = new Proxy(window.Object.defineProperty, e);
                    }();
                    Object.defineProperty(Window.prototype.toString, "121f6100a828e1c169bfff6bafc69bfd", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "121f6100a828e1c169bfff6bafc69bfd" due to: ' + e);
            }
        }
    },
    "window.google_tag_manager = function() {};": {
        uniqueId: "62de8ad86c59d0b7297a578a18ec0db3",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["62de8ad86c59d0b7297a578a18ec0db3"] !== e) {
                    window.google_tag_manager = function() {};
                    Object.defineProperty(Window.prototype.toString, "62de8ad86c59d0b7297a578a18ec0db3", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "62de8ad86c59d0b7297a578a18ec0db3" due to: ' + e);
            }
        }
    },
    '(()=>{window.TATM=window.TATM||{},TATM.init=()=>{},TATM.initAdUnits=()=>{},TATM.pageReady=()=>{},TATM.getVast=function(n){return new Promise((n=>{n()}))},TATM.push=function(n){if("function"==typeof n)try{n()}catch(n){console.debug(n)}};})();': {
        uniqueId: "103de1b5e23e730a477b9b7da10564a4",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["103de1b5e23e730a477b9b7da10564a4"] !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "103de1b5e23e730a477b9b7da10564a4" due to: ' + e);
            }
        }
    },
    '(()=>{document.location.href.includes("/pop_advisor")&&AG_onLoad((function(){const e=new CustomEvent("visibilitychange"),t=t=>{Object.defineProperty(t.view.top.document,"hidden",{value:!0,writable:!0}),t.view.top.document.dispatchEvent(e),setTimeout((()=>{Object.defineProperty(t.view.top.document,"hidden",{value:!1,writable:!0}),t.view.top.document.dispatchEvent(e)}),100)},n=document.querySelector("button.btn-continu");n&&n.addEventListener("click",t)}));})();': {
        uniqueId: "9105fbea3c208d7590ffd7dfbc250c40",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["9105fbea3c208d7590ffd7dfbc250c40"] !== e) {
                    document.location.href.includes("/pop_advisor") && AG_onLoad((function() {
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
                    Object.defineProperty(Window.prototype.toString, "9105fbea3c208d7590ffd7dfbc250c40", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "9105fbea3c208d7590ffd7dfbc250c40" due to: ' + e);
            }
        }
    },
    '(function(){var a={cmd:[],public:{getVideoAdUrl:function(){},createNewPosition:function(){},refreshAds:function(){},setTargetingOnPosition:function(){},getDailymotionAdsParamsForScript:function(c,a){if("function"==typeof a)try{if(1===a.length){a({})}}catch(a){}}}};a.cmd.push=function(b){let a=function(){try{"function"==typeof b&&b()}catch(a){}};"complete"===document.readyState?a():window.addEventListener("load",()=>{a()})},window.jad=a})();': {
        uniqueId: "176456e95ac0c8ff1ac49bbf30461c8b",
        func: () => {
            try {
                const t = "done";
                if (Window.prototype.toString["176456e95ac0c8ff1ac49bbf30461c8b"] !== t) {
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
                }
            } catch (t) {
                console.error('Error executing AG js rule with uniqueId "176456e95ac0c8ff1ac49bbf30461c8b" due to: ' + t);
            }
        }
    },
    "var _st = window.setTimeout; window.setTimeout = function(a, b) { if(!/target_url/.test(a)){ _st(a,b);}};": {
        uniqueId: "315672b76833d426a2a0b83c85c50797",
        func: () => {
            try {
                const t = "done";
                if (Window.prototype.toString["315672b76833d426a2a0b83c85c50797"] !== t) {
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
                }
            } catch (t) {
                console.error('Error executing AG js rule with uniqueId "315672b76833d426a2a0b83c85c50797" due to: ' + t);
            }
        }
    },
    '(function(){let callCounter=0;const nativeJSONParse=JSON.parse;const handler={apply(){callCounter++;const obj=Reflect.apply(...arguments);if(callCounter<=10){if(obj.hasOwnProperty("appName")){if(obj.applaunch?.data?.player?.features?.ad?.enabled){obj.applaunch.data.player.features.ad.enabled=false}if(obj.applaunch?.data?.player?.features?.ad?.dai?.enabled){obj.applaunch.data.player.features.ad.dai.enabled=false}}}else{JSON.parse=nativeJSONParse}return obj}};JSON.parse=new Proxy(JSON.parse,handler)})();': {
        uniqueId: "03b60dbf8e3b5b8f2423393210afcf06",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["03b60dbf8e3b5b8f2423393210afcf06"] !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "03b60dbf8e3b5b8f2423393210afcf06" due to: ' + e);
            }
        }
    },
    "(function(){let callCounter=0;const nativeJSONParse=JSON.parse;const handler={apply(){callCounter++;const obj=Reflect.apply(...arguments);if(callCounter<=10){if(obj.hasOwnProperty('env')&&obj.env.hasOwnProperty('origin')){if(!obj.hasOwnProperty('ads')){obj.ads={};}obj.ads.enable=false;obj.ads._prerolls=false;obj.ads._midrolls=false;}}else{JSON.parse=nativeJSONParse;}return obj;}};JSON.parse=new Proxy(JSON.parse,handler);})();": {
        uniqueId: "076ec28f8d5bd40b7dc4be56dc82b841",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["076ec28f8d5bd40b7dc4be56dc82b841"] !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "076ec28f8d5bd40b7dc4be56dc82b841" due to: ' + e);
            }
        }
    },
    '(()=>{window.patroniteGdprData={google_recaptcha:"allow"}})();': {
        uniqueId: "fc25d8c99ebbbc3be6aedb39d0c00819",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.fc25d8c99ebbbc3be6aedb39d0c00819 !== e) {
                    window.patroniteGdprData = {
                        google_recaptcha: "allow"
                    };
                    Object.defineProperty(Window.prototype.toString, "fc25d8c99ebbbc3be6aedb39d0c00819", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "fc25d8c99ebbbc3be6aedb39d0c00819" due to: ' + e);
            }
        }
    },
    '(()=>{let t;const e=new MutationObserver(((e,o)=>{const n=t?.querySelector(\'button[data-testid="button-agree"]\');n&&(setTimeout((()=>{n.click()}),500),o.disconnect())})),o={apply:(o,n,c)=>{const a=Reflect.apply(o,n,c);return n.matches(".szn-cmp-dialog-container")&&(t=a),e.observe(a,{subtree:!0,childList:!0}),a}};window.Element.prototype.attachShadow=new Proxy(window.Element.prototype.attachShadow,o)})();': {
        uniqueId: "2bca593aa0d901f23a66e9e0ba973abc",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["2bca593aa0d901f23a66e9e0ba973abc"] !== e) {
                    (() => {
                        let e;
                        const t = new MutationObserver(((t, a) => {
                            const o = e?.querySelector('button[data-testid="button-agree"]');
                            o && (setTimeout((() => {
                                o.click();
                            }), 500), a.disconnect());
                        })), a = {
                            apply: (a, o, n) => {
                                const r = Reflect.apply(a, o, n);
                                return o.matches(".szn-cmp-dialog-container") && (e = r), t.observe(r, {
                                    subtree: !0,
                                    childList: !0
                                }), r;
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "2bca593aa0d901f23a66e9e0ba973abc" due to: ' + e);
            }
        }
    },
    '(function(){var noopFunc=function(){};var tcData={eventStatus:"tcloaded",gdprApplies:!1,listenerId:noopFunc,vendor:{consents:{967:true}},purpose:{consents:[]}};window.__tcfapi=function(command,version,callback){"function"==typeof callback&&"removeEventListener"!==command&&callback(tcData,!0)}})();': {
        uniqueId: "905285a22b2c90f963ab16245e1f463b",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["905285a22b2c90f963ab16245e1f463b"] !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "905285a22b2c90f963ab16245e1f463b" due to: ' + e);
            }
        }
    },
    'document.cookie="PostAnalytics=inactive; path=/;";': {
        uniqueId: "8dd64e0e5c7cfb7ada0186747714df1b",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["8dd64e0e5c7cfb7ada0186747714df1b"] !== e) {
                    document.cookie = "PostAnalytics=inactive; path=/;";
                    Object.defineProperty(Window.prototype.toString, "8dd64e0e5c7cfb7ada0186747714df1b", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "8dd64e0e5c7cfb7ada0186747714df1b" due to: ' + e);
            }
        }
    },
    "document.cookie='_s.cookie_consent=marketing=0:analytics=0:version=2021-07-01;path=/;';": {
        uniqueId: "7b3e4976177c32f619f7f7447a7c366e",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["7b3e4976177c32f619f7f7447a7c366e"] !== e) {
                    document.cookie = "_s.cookie_consent=marketing=0:analytics=0:version=2021-07-01;path=/;";
                    Object.defineProperty(Window.prototype.toString, "7b3e4976177c32f619f7f7447a7c366e", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "7b3e4976177c32f619f7f7447a7c366e" due to: ' + e);
            }
        }
    },
    "document.cookie='cmplz_consented_services={\"youtube\":true};path=/;';": {
        uniqueId: "8cbd0cd2ffcfd41b8dd501b4861c18e3",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["8cbd0cd2ffcfd41b8dd501b4861c18e3"] !== e) {
                    document.cookie = 'cmplz_consented_services={"youtube":true};path=/;';
                    Object.defineProperty(Window.prototype.toString, "8cbd0cd2ffcfd41b8dd501b4861c18e3", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "8cbd0cd2ffcfd41b8dd501b4861c18e3" due to: ' + e);
            }
        }
    },
    '(function(){if(!document.cookie.includes("CookieInformationConsent=")){var a=encodeURIComponent(\'{"website_uuid":"","timestamp":"","consent_url":"","consent_website":"jysk.nl","consent_domain":"jysk.nl","user_uid":"","consents_approved":["cookie_cat_necessary","cookie_cat_functional","cookie_cat_statistic"],"consents_denied":[],"user_agent":""}\');document.cookie="CookieInformationConsent="+a+"; path=/;"}})();': {
        uniqueId: "4e7a66fe06a58f87f9deb67cb85b8a2c",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["4e7a66fe06a58f87f9deb67cb85b8a2c"] !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "4e7a66fe06a58f87f9deb67cb85b8a2c" due to: ' + e);
            }
        }
    },
    'document.cookie=\'cookie_consent_level={"functionality":true,"strictly-necessary":true,"targeting":false,"tracking":false}; path=/;\';': {
        uniqueId: "bee65ec0755ccff706db52148c4173c7",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.bee65ec0755ccff706db52148c4173c7 !== e) {
                    document.cookie = 'cookie_consent_level={"functionality":true,"strictly-necessary":true,"targeting":false,"tracking":false}; path=/;';
                    Object.defineProperty(Window.prototype.toString, "bee65ec0755ccff706db52148c4173c7", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "bee65ec0755ccff706db52148c4173c7" due to: ' + e);
            }
        }
    },
    '(function(){try{var a=location.pathname.split("/")[1],b="dra_cookie_consent_allowed_"+a,c=new RegExp(/[a-z]+_[a-z]+/);if(!document.cookie.includes(b)&&c.test(a)){var d=encodeURIComponent("v=1&t=1&f=1&s=0&m=0");document.cookie=b+"="+d+"; path=/;"}}catch(e){}})();': {
        uniqueId: "89284264a9e746e269120c04d8e07578",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["89284264a9e746e269120c04d8e07578"] !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "89284264a9e746e269120c04d8e07578" due to: ' + e);
            }
        }
    },
    'document.cookie="dw_cookies_accepted=D; path=/;";': {
        uniqueId: "65ddec250513cfa895af9e691c980515",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["65ddec250513cfa895af9e691c980515"] !== e) {
                    document.cookie = "dw_cookies_accepted=D; path=/;";
                    Object.defineProperty(Window.prototype.toString, "65ddec250513cfa895af9e691c980515", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "65ddec250513cfa895af9e691c980515" due to: ' + e);
            }
        }
    },
    '(function(){document.cookie.includes("cookies-consents")||(document.cookie=\'cookies-consents={"ad_storage":false,"analytics_storage":false}\')})();': {
        uniqueId: "ccaa77db2be3c96b3a11b73a501af1f1",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.ccaa77db2be3c96b3a11b73a501af1f1 !== e) {
                    document.cookie.includes("cookies-consents") || (document.cookie = 'cookies-consents={"ad_storage":false,"analytics_storage":false}');
                    Object.defineProperty(Window.prototype.toString, "ccaa77db2be3c96b3a11b73a501af1f1", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "ccaa77db2be3c96b3a11b73a501af1f1" due to: ' + e);
            }
        }
    },
    'document.cookie="ubCmpSettings=eyJnZW1laW5kZW5fc2VsZWN0ZWRfdmFsdWUiOnRydWUsImdvb2dsZV9hbmFseXRpY3MiOmZhbHNlLCJhZF90cmFja2luZyI6ZmFsc2UsInNvY2lhbF9lbWJlZHMiOnRydWV9;path=/;";': {
        uniqueId: "58bc9348bcf4f1f2b6163529b3298384",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["58bc9348bcf4f1f2b6163529b3298384"] !== e) {
                    document.cookie = "ubCmpSettings=eyJnZW1laW5kZW5fc2VsZWN0ZWRfdmFsdWUiOnRydWUsImdvb2dsZV9hbmFseXRpY3MiOmZhbHNlLCJhZF90cmFja2luZyI6ZmFsc2UsInNvY2lhbF9lbWJlZHMiOnRydWV9;path=/;";
                    Object.defineProperty(Window.prototype.toString, "58bc9348bcf4f1f2b6163529b3298384", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "58bc9348bcf4f1f2b6163529b3298384" due to: ' + e);
            }
        }
    },
    'document.cookie="cookieconsent_status=allow; path=/;";': {
        uniqueId: "95e24d457a7de10b441b7cbe6b509b42",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["95e24d457a7de10b441b7cbe6b509b42"] !== e) {
                    document.cookie = "cookieconsent_status=allow; path=/;";
                    Object.defineProperty(Window.prototype.toString, "95e24d457a7de10b441b7cbe6b509b42", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "95e24d457a7de10b441b7cbe6b509b42" due to: ' + e);
            }
        }
    },
    'document.cookie="cookieConsentLevel=functional; path=/;";': {
        uniqueId: "787f6ec1d270f080d84075658a3154bd",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["787f6ec1d270f080d84075658a3154bd"] !== e) {
                    document.cookie = "cookieConsentLevel=functional; path=/;";
                    Object.defineProperty(Window.prototype.toString, "787f6ec1d270f080d84075658a3154bd", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "787f6ec1d270f080d84075658a3154bd" due to: ' + e);
            }
        }
    },
    'document.cookie="cookies_accept=all; path=/;";': {
        uniqueId: "25fbbc330687fea937e26e0888468fc1",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["25fbbc330687fea937e26e0888468fc1"] !== e) {
                    document.cookie = "cookies_accept=all; path=/;";
                    Object.defineProperty(Window.prototype.toString, "25fbbc330687fea937e26e0888468fc1", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "25fbbc330687fea937e26e0888468fc1" due to: ' + e);
            }
        }
    },
    'document.cookie="waconcookiemanagement=min; path=/;";': {
        uniqueId: "0898665962f7d4da16a3e93e72148415",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["0898665962f7d4da16a3e93e72148415"] !== e) {
                    document.cookie = "waconcookiemanagement=min; path=/;";
                    Object.defineProperty(Window.prototype.toString, "0898665962f7d4da16a3e93e72148415", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "0898665962f7d4da16a3e93e72148415" due to: ' + e);
            }
        }
    },
    'document.cookie="apcAcceptedTrackingCookie3=1111000; path=/;";': {
        uniqueId: "ebce46e2aa13a6690a7be922ea601529",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.ebce46e2aa13a6690a7be922ea601529 !== e) {
                    document.cookie = "apcAcceptedTrackingCookie3=1111000; path=/;";
                    Object.defineProperty(Window.prototype.toString, "ebce46e2aa13a6690a7be922ea601529", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "ebce46e2aa13a6690a7be922ea601529" due to: ' + e);
            }
        }
    },
    'document.cookie="bbDatenstufe=stufe3; path=/;";': {
        uniqueId: "9d2c1d25c86235dc271dab2c2b2e99b2",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["9d2c1d25c86235dc271dab2c2b2e99b2"] !== e) {
                    document.cookie = "bbDatenstufe=stufe3; path=/;";
                    Object.defineProperty(Window.prototype.toString, "9d2c1d25c86235dc271dab2c2b2e99b2", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "9d2c1d25c86235dc271dab2c2b2e99b2" due to: ' + e);
            }
        }
    },
    'document.cookie="newsletter-signup=viewed; path=/;";': {
        uniqueId: "0cee21006fa668615b19188582a82e34",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["0cee21006fa668615b19188582a82e34"] !== e) {
                    document.cookie = "newsletter-signup=viewed; path=/;";
                    Object.defineProperty(Window.prototype.toString, "0cee21006fa668615b19188582a82e34", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "0cee21006fa668615b19188582a82e34" due to: ' + e);
            }
        }
    },
    'document.cookie="user_cookie_consent=essential; path=/";': {
        uniqueId: "00c1162ebf92fa57d12e33c78f9ab876",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["00c1162ebf92fa57d12e33c78f9ab876"] !== e) {
                    document.cookie = "user_cookie_consent=essential; path=/";
                    Object.defineProperty(Window.prototype.toString, "00c1162ebf92fa57d12e33c78f9ab876", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "00c1162ebf92fa57d12e33c78f9ab876" due to: ' + e);
            }
        }
    },
    'document.cookie="cookiebanner=closed; path=/;";': {
        uniqueId: "64b6a01f2a020125dffd898bafb19615",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["64b6a01f2a020125dffd898bafb19615"] !== e) {
                    document.cookie = "cookiebanner=closed; path=/;";
                    Object.defineProperty(Window.prototype.toString, "64b6a01f2a020125dffd898bafb19615", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "64b6a01f2a020125dffd898bafb19615" due to: ' + e);
            }
        }
    },
    'document.cookie=\'allow_cookies={"essential":"1","functional":{"all":"1"},"marketing":{"all":"0"}}; path=/;\';': {
        uniqueId: "d61d4bd09c7716fa4e2f0235b892e274",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.d61d4bd09c7716fa4e2f0235b892e274 !== e) {
                    document.cookie = 'allow_cookies={"essential":"1","functional":{"all":"1"},"marketing":{"all":"0"}}; path=/;';
                    Object.defineProperty(Window.prototype.toString, "d61d4bd09c7716fa4e2f0235b892e274", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "d61d4bd09c7716fa4e2f0235b892e274" due to: ' + e);
            }
        }
    },
    '(function(){-1==document.cookie.indexOf("GPRD")&&(document.cookie="GPRD=128; path=/;",location.reload())})();': {
        uniqueId: "dcadc5846fed7b2f033974e6075c5fed",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.dcadc5846fed7b2f033974e6075c5fed !== e) {
                    -1 == document.cookie.indexOf("GPRD") && (document.cookie = "GPRD=128; path=/;", 
                    location.reload());
                    Object.defineProperty(Window.prototype.toString, "dcadc5846fed7b2f033974e6075c5fed", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "dcadc5846fed7b2f033974e6075c5fed" due to: ' + e);
            }
        }
    },
    'document.cookie="acceptRodoSie=hide; path=/;";': {
        uniqueId: "d52e913bca352f639daec5b240f07513",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.d52e913bca352f639daec5b240f07513 !== e) {
                    document.cookie = "acceptRodoSie=hide; path=/;";
                    Object.defineProperty(Window.prototype.toString, "d52e913bca352f639daec5b240f07513", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "d52e913bca352f639daec5b240f07513" due to: ' + e);
            }
        }
    },
    '(function(){-1==document.cookie.indexOf("cookie-functional")&&(document.cookie="cookie-functional=1; path=/;",document.cookie="popupek=1; path=/;",location.reload())})();': {
        uniqueId: "23d2c0ec8e7bc0167527c1acc5bb5355",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["23d2c0ec8e7bc0167527c1acc5bb5355"] !== e) {
                    -1 == document.cookie.indexOf("cookie-functional") && (document.cookie = "cookie-functional=1; path=/;", 
                    document.cookie = "popupek=1; path=/;", location.reload());
                    Object.defineProperty(Window.prototype.toString, "23d2c0ec8e7bc0167527c1acc5bb5355", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "23d2c0ec8e7bc0167527c1acc5bb5355" due to: ' + e);
            }
        }
    },
    '(function(){-1==document.cookie.indexOf("ccb")&&(document.cookie="ccb=facebookAccepted=0&googleAnalyticsAccepted=0&commonCookies=1; path=/;",location.reload())})();': {
        uniqueId: "f2aea7e44ba000bb61336ea707125580",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.f2aea7e44ba000bb61336ea707125580 !== e) {
                    -1 == document.cookie.indexOf("ccb") && (document.cookie = "ccb=facebookAccepted=0&googleAnalyticsAccepted=0&commonCookies=1; path=/;", 
                    location.reload());
                    Object.defineProperty(Window.prototype.toString, "f2aea7e44ba000bb61336ea707125580", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "f2aea7e44ba000bb61336ea707125580" due to: ' + e);
            }
        }
    },
    "(function(){-1===document.cookie.indexOf(\"CookieConsent\")&&(document.cookie='CookieConsent=mandatory|osm; path=/;')})();": {
        uniqueId: "f7a28a06b7a2a2e94cb072030083586d",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.f7a28a06b7a2a2e94cb072030083586d !== e) {
                    -1 === document.cookie.indexOf("CookieConsent") && (document.cookie = "CookieConsent=mandatory|osm; path=/;");
                    Object.defineProperty(Window.prototype.toString, "f7a28a06b7a2a2e94cb072030083586d", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "f7a28a06b7a2a2e94cb072030083586d" due to: ' + e);
            }
        }
    },
    '(function(){-1===document.cookie.indexOf("CookieControl")&&(document.cookie=\'CookieControl={"necessaryCookies":["wordpress_*","wordpress_logged_in_*","CookieControl"],"optionalCookies":{"functional_cookies":"accepted"}}\')})();': {
        uniqueId: "06ad4ed929d84e1793e13be6c4a31b38",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["06ad4ed929d84e1793e13be6c4a31b38"] !== e) {
                    -1 === document.cookie.indexOf("CookieControl") && (document.cookie = 'CookieControl={"necessaryCookies":["wordpress_*","wordpress_logged_in_*","CookieControl"],"optionalCookies":{"functional_cookies":"accepted"}}');
                    Object.defineProperty(Window.prototype.toString, "06ad4ed929d84e1793e13be6c4a31b38", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "06ad4ed929d84e1793e13be6c4a31b38" due to: ' + e);
            }
        }
    },
    '(function(){if(-1==document.cookie.indexOf("CONSENT")){var c=new Date, d=c.getTime(), date = new Date(d + 365 * 60 * 60 * 1000); document.cookie="CONSENT=301212NN; path=/; expires=" + date.toUTCString(), location.reload()}})();': {
        uniqueId: "2f7b46464b7a29f89080a98e454b73a8",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["2f7b46464b7a29f89080a98e454b73a8"] !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "2f7b46464b7a29f89080a98e454b73a8" due to: ' + e);
            }
        }
    },
    'document.cookie="dsgvo=basic; path=/;";': {
        uniqueId: "c8f808a7e878f97d64286800484605d0",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.c8f808a7e878f97d64286800484605d0 !== e) {
                    document.cookie = "dsgvo=basic; path=/;";
                    Object.defineProperty(Window.prototype.toString, "c8f808a7e878f97d64286800484605d0", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "c8f808a7e878f97d64286800484605d0" due to: ' + e);
            }
        }
    },
    '(function(){if(!document.cookie.includes("CookieInformationConsent=")){var a=encodeURIComponent(\'{"website_uuid":"","timestamp":"","consent_url":"","consent_website":"elkjop.no","consent_domain":"elkjop.no","user_uid":"","consents_approved":["cookie_cat_necessary","cookie_cat_functional","cookie_cat_statistic"],"consents_denied":[],"user_agent":""}\');document.cookie="CookieInformationConsent="+a+"; path=/;"}})();': {
        uniqueId: "6051620f594fcf9636bd68b417cb0e5b",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["6051620f594fcf9636bd68b417cb0e5b"] !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "6051620f594fcf9636bd68b417cb0e5b" due to: ' + e);
            }
        }
    },
    '(function(){var a={timestamp:(new Date).getTime(),choice:2,version:"1.0"};document.cookie="mxp="+JSON.stringify(a)+"; path=/"})();': {
        uniqueId: "4cdd2100913b4096462563fee10f5daa",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["4cdd2100913b4096462563fee10f5daa"] !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "4cdd2100913b4096462563fee10f5daa" due to: ' + e);
            }
        }
    },
    '(function(){if(-1==document.cookie.indexOf("_chorus_privacy_consent")&&document.location.hostname.includes("bavarianfootballworks.com")){var c=new Date, d=c.getTime(), date = new Date(d + 365 * 60 * 60 * 1000); document.cookie="_chorus_privacy_consent="+d+"; path=/; expires=" + date.toUTCString(), location.reload()}})();': {
        uniqueId: "504f6b7ac8c9c857fc49addc0eb518fd",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["504f6b7ac8c9c857fc49addc0eb518fd"] !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "504f6b7ac8c9c857fc49addc0eb518fd" due to: ' + e);
            }
        }
    },
    '(function(){if(-1==document.cookie.indexOf("_chorus_privacy_consent")&&document.location.hostname.includes("goldenstateofmind.com")){var c=new Date, d=c.getTime(), date = new Date(d + 365 * 60 * 60 * 1000); document.cookie="_chorus_privacy_consent="+d+"; path=/; expires=" + date.toUTCString(), location.reload()}})();': {
        uniqueId: "62fd4c05daebdd55280e0b23009cc9aa",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["62fd4c05daebdd55280e0b23009cc9aa"] !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "62fd4c05daebdd55280e0b23009cc9aa" due to: ' + e);
            }
        }
    },
    '(function(){if(-1==document.cookie.indexOf("_chorus_privacy_consent")&&document.location.hostname.includes("mmafighting.com")){var c=new Date, d=c.getTime(), date = new Date(d + 365 * 60 * 60 * 1000); document.cookie="_chorus_privacy_consent="+d+"; path=/; expires=" + date.toUTCString(), location.reload()}})();': {
        uniqueId: "1a42ed4d4e4e6922f6fda946f00f4816",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["1a42ed4d4e4e6922f6fda946f00f4816"] !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "1a42ed4d4e4e6922f6fda946f00f4816" due to: ' + e);
            }
        }
    },
    '(function(){-1==document.cookie.indexOf("cms_cookies")&&(document.cookie="cms_cookies=6; path=/;",document.cookie="cms_cookies_saved=true; path=/;",location.reload())})();': {
        uniqueId: "c69eca07b387ee449234ff30bf5ce30e",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.c69eca07b387ee449234ff30bf5ce30e !== e) {
                    -1 == document.cookie.indexOf("cms_cookies") && (document.cookie = "cms_cookies=6; path=/;", 
                    document.cookie = "cms_cookies_saved=true; path=/;", location.reload());
                    Object.defineProperty(Window.prototype.toString, "c69eca07b387ee449234ff30bf5ce30e", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "c69eca07b387ee449234ff30bf5ce30e" due to: ' + e);
            }
        }
    },
    'document.cookie="erlaubte_cookies=1; path=/;";': {
        uniqueId: "fa4fb1ef63a96ddb1e25a44e7d9cfcfe",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.fa4fb1ef63a96ddb1e25a44e7d9cfcfe !== e) {
                    document.cookie = "erlaubte_cookies=1; path=/;";
                    Object.defineProperty(Window.prototype.toString, "fa4fb1ef63a96ddb1e25a44e7d9cfcfe", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "fa4fb1ef63a96ddb1e25a44e7d9cfcfe" due to: ' + e);
            }
        }
    },
    'document.cookie="klaviano_police=1; path=/;";': {
        uniqueId: "0625bed2a838c73f77094993c60b81cc",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["0625bed2a838c73f77094993c60b81cc"] !== e) {
                    document.cookie = "klaviano_police=1; path=/;";
                    Object.defineProperty(Window.prototype.toString, "0625bed2a838c73f77094993c60b81cc", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "0625bed2a838c73f77094993c60b81cc" due to: ' + e);
            }
        }
    },
    'document.cookie=\'cookieConsent={"statistical":0,"personalization":0,"targeting":0}; path=/;\';': {
        uniqueId: "f5b9b753afe5738b6731ee8166dcd891",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.f5b9b753afe5738b6731ee8166dcd891 !== e) {
                    document.cookie = 'cookieConsent={"statistical":0,"personalization":0,"targeting":0}; path=/;';
                    Object.defineProperty(Window.prototype.toString, "f5b9b753afe5738b6731ee8166dcd891", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "f5b9b753afe5738b6731ee8166dcd891" due to: ' + e);
            }
        }
    },
    '(function(){if(!document.cookie.includes("trackingPermissionConsentsValue=")){var a=encodeURIComponent(\'"cookies_analytics":false,"cookies_personalization":false,"cookies_advertisement":false\');document.cookie="trackingPermissionConsentsValue={"+a+"}; path=/;"}})();': {
        uniqueId: "c99384d0ca41c87dbb63212ebb71470f",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.c99384d0ca41c87dbb63212ebb71470f !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "c99384d0ca41c87dbb63212ebb71470f" due to: ' + e);
            }
        }
    },
    'document.cookie="allowTracking=false; path=/;"; document.cookie="trackingSettings={%22ads%22:false%2C%22performance%22:false}; path=/;";': {
        uniqueId: "380715610fe9f7be74ee211b5df06559",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["380715610fe9f7be74ee211b5df06559"] !== e) {
                    document.cookie = "allowTracking=false; path=/;";
                    document.cookie = "trackingSettings={%22ads%22:false%2C%22performance%22:false}; path=/;";
                    Object.defineProperty(Window.prototype.toString, "380715610fe9f7be74ee211b5df06559", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "380715610fe9f7be74ee211b5df06559" due to: ' + e);
            }
        }
    },
    'document.cookie="userConsent=%7B%22marketing%22%3Afalse%2C%22version%22%3A%221%22%7D; path=/;";': {
        uniqueId: "967efe0b8b7e9d602d9c0ecdf20fc0cf",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["967efe0b8b7e9d602d9c0ecdf20fc0cf"] !== e) {
                    document.cookie = "userConsent=%7B%22marketing%22%3Afalse%2C%22version%22%3A%221%22%7D; path=/;";
                    Object.defineProperty(Window.prototype.toString, "967efe0b8b7e9d602d9c0ecdf20fc0cf", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "967efe0b8b7e9d602d9c0ecdf20fc0cf" due to: ' + e);
            }
        }
    },
    'document.cookie="sendgb_cookiewarning=1; path=/;";': {
        uniqueId: "190bccd6dfb21f403e2765c76b59110f",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["190bccd6dfb21f403e2765c76b59110f"] !== e) {
                    document.cookie = "sendgb_cookiewarning=1; path=/;";
                    Object.defineProperty(Window.prototype.toString, "190bccd6dfb21f403e2765c76b59110f", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "190bccd6dfb21f403e2765c76b59110f" due to: ' + e);
            }
        }
    },
    'document.cookie="rodopop=1; path=/;";': {
        uniqueId: "9ed981f72e0e18755c3a1ffe09bbd2ba",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["9ed981f72e0e18755c3a1ffe09bbd2ba"] !== e) {
                    document.cookie = "rodopop=1; path=/;";
                    Object.defineProperty(Window.prototype.toString, "9ed981f72e0e18755c3a1ffe09bbd2ba", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "9ed981f72e0e18755c3a1ffe09bbd2ba" due to: ' + e);
            }
        }
    },
    'document.cookie="eu_cn=1; path=/;";': {
        uniqueId: "868ecbdfeac245c25b130bfba6792d71",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["868ecbdfeac245c25b130bfba6792d71"] !== e) {
                    document.cookie = "eu_cn=1; path=/;";
                    Object.defineProperty(Window.prototype.toString, "868ecbdfeac245c25b130bfba6792d71", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "868ecbdfeac245c25b130bfba6792d71" due to: ' + e);
            }
        }
    },
    'document.cookie="gdprAccepted=true; path=/;";': {
        uniqueId: "2c12d864ca83dfdf8bc7e1c395c19fef",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["2c12d864ca83dfdf8bc7e1c395c19fef"] !== e) {
                    document.cookie = "gdprAccepted=true; path=/;";
                    Object.defineProperty(Window.prototype.toString, "2c12d864ca83dfdf8bc7e1c395c19fef", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "2c12d864ca83dfdf8bc7e1c395c19fef" due to: ' + e);
            }
        }
    },
    '(function(){if(-1==document.cookie.indexOf("BCPermissionLevel")){var c=new Date, d=c.getTime(), date = new Date(d + 365 * 60 * 60 * 1000); document.cookie="BCPermissionLevel=PERSONAL; path=/; expires=" + date.toUTCString(), location.reload()}})();': {
        uniqueId: "29fd06a58b635f18a26d675807f87ee7",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["29fd06a58b635f18a26d675807f87ee7"] !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "29fd06a58b635f18a26d675807f87ee7" due to: ' + e);
            }
        }
    },
    '(function(){if(-1==document.cookie.indexOf("_chorus_privacy_consent")){var c=new Date, d=c.getTime(), date = new Date(d + 365 * 60 * 60 * 1000); document.cookie="_chorus_privacy_consent="+d+"; path=/; expires=" + date.toUTCString(), location.reload()}})();': {
        uniqueId: "e7ea60642fa9501751b42fd2fe95103b",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.e7ea60642fa9501751b42fd2fe95103b !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "e7ea60642fa9501751b42fd2fe95103b" due to: ' + e);
            }
        }
    },
    "!function(a,b,c,f,g,d,e){e=a[c]||a['WebKit'+c]||a['Moz'+c],e&&(d=new e(function(){b[f].contains(g)&&(b[f].remove(g),d.disconnect())}),d.observe(b,{attributes:!0,attributeFilter:['class']}))}(window,document.documentElement,'MutationObserver','classList','layer_cookie__visible');": {
        uniqueId: "61e6ac2655edf1e9450373c1fd849cd0",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["61e6ac2655edf1e9450373c1fd849cd0"] !== e) {
                    !function(e, t, o, c, n, i, r) {
                        (r = e[o] || e["WebKit" + o] || e["Moz" + o]) && (i = new r((function() {
                            t[c].contains(n) && (t[c].remove(n), i.disconnect());
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "61e6ac2655edf1e9450373c1fd849cd0" due to: ' + e);
            }
        }
    },
    'var cw;Object.defineProperty(window,"cookieWallSettings",{get:function(){return cw},set:function(a){document.cookie="rtlcookieconsent="+a.version.toString()+";";cw=a}});': {
        uniqueId: "b32831777a037cfe79fc602cdef09ab7",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.b32831777a037cfe79fc602cdef09ab7 !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "b32831777a037cfe79fc602cdef09ab7" due to: ' + e);
            }
        }
    },
    '(()=>{if(!location.pathname.includes("/search"))return;const t={attributes:!0,childList:!0,subtree:!0},e=(t,e)=>{for(const n of t){const t=n.target.querySelector(".privacy-statement + .get-started-btn-wrapper > button.inline-explicit");t&&(t.click(),e.disconnect())}},n={apply:(n,o,c)=>{const r=Reflect.apply(n,o,c);if(o&&o.matches("cib-muid-consent")){new MutationObserver(e).observe(r,t)}return r}};window.Element.prototype.attachShadow=new Proxy(window.Element.prototype.attachShadow,n)})();': {
        uniqueId: "36fc3a243e85a682dd99c26376ad6c57",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["36fc3a243e85a682dd99c26376ad6c57"] !== e) {
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
                            apply: (o, r, c) => {
                                const n = Reflect.apply(o, r, c);
                                r && r.matches("cib-muid-consent") && new MutationObserver(t).observe(n, e);
                                return n;
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "36fc3a243e85a682dd99c26376ad6c57" due to: ' + e);
            }
        }
    },
    '(()=>{let t,e=!1;const o=new MutationObserver(((e,o)=>{const c=t?.querySelector(\'button[data-testid="uc-accept-all-button"]\');c&&(c.click(),o.disconnect())})),c={apply:(c,n,p)=>{const r=Reflect.apply(c,n,p);return!e&&n.matches("#usercentrics-root")&&(e=!0,t=r),o.observe(r,{subtree:!0,childList:!0}),r}};window.Element.prototype.attachShadow=new Proxy(window.Element.prototype.attachShadow,c)})();': {
        uniqueId: "c3fa9bec7cb9559b8965f87071a37fc6",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.c3fa9bec7cb9559b8965f87071a37fc6 !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "c3fa9bec7cb9559b8965f87071a37fc6" due to: ' + e);
            }
        }
    },
    '(()=>{let t,e=!1;const o=new MutationObserver(((e,o)=>{const c=t?.querySelector("#cmpbox a.cmptxt_btn_yes");c&&(c.click(),o.disconnect())})),c={apply:(c,n,p)=>{const r=Reflect.apply(c,n,p);return!e&&n.matches("#cmpwrapper")&&(e=!0,t=r),o.observe(r,{subtree:!0,childList:!0}),r}};window.Element.prototype.attachShadow=new Proxy(window.Element.prototype.attachShadow,c)})();': {
        uniqueId: "9c5d8cfc5b5533f486ab90d24d15e42c",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["9c5d8cfc5b5533f486ab90d24d15e42c"] !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "9c5d8cfc5b5533f486ab90d24d15e42c" due to: ' + e);
            }
        }
    },
    '(function(){window.self!==window.top||document.cookie.includes("visitor=")||(document.cookie="visitor=1; path=/;",document.cookie&&location.reload())})();': {
        uniqueId: "9907768cd527256baba4120870996330",
        func: () => {
            try {
                const o = "done";
                if (Window.prototype.toString["9907768cd527256baba4120870996330"] !== o) {
                    window.self !== window.top || document.cookie.includes("visitor=") || (document.cookie = "visitor=1; path=/;", 
                    document.cookie && location.reload());
                    Object.defineProperty(Window.prototype.toString, "9907768cd527256baba4120870996330", {
                        value: o,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (o) {
                console.error('Error executing AG js rule with uniqueId "9907768cd527256baba4120870996330" due to: ' + o);
            }
        }
    },
    '(function(){try{var time=(new Date).getTime();var cookieDate=new Date(time+1314E6);var hostname=location.host;var locSubString=null;if(!hostname.startsWith("google.")&&!hostname.startsWith("youtube."))locSubString=hostname.substring(hostname.indexOf(".")+1);var loc=locSubString||hostname;if(document.cookie.indexOf("CONSENT=YES")!==-1)return;document.cookie="CONSENT=YES+; domain="+loc+"; path=/; expires="+cookieDate.toUTCString()}catch(ex){console.error("AG: failed to set consent cookie: "+ex)}})();': {
        uniqueId: "e1a7ebd323b27eb0aa0e7a309ebca4e9",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.e1a7ebd323b27eb0aa0e7a309ebca4e9 !== e) {
                    !function() {
                        try {
                            var e = (new Date).getTime(), t = new Date(e + 1314e6), o = location.host, a = null;
                            o.startsWith("google.") || o.startsWith("youtube.") || (a = o.substring(o.indexOf(".") + 1));
                            var r = a || o;
                            if (-1 !== document.cookie.indexOf("CONSENT=YES")) return;
                            document.cookie = "CONSENT=YES+; domain=" + r + "; path=/; expires=" + t.toUTCString();
                        } catch (e) {
                            console.error("AG: failed to set consent cookie: " + e);
                        }
                    }();
                    Object.defineProperty(Window.prototype.toString, "e1a7ebd323b27eb0aa0e7a309ebca4e9", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "e1a7ebd323b27eb0aa0e7a309ebca4e9" due to: ' + e);
            }
        }
    },
    '(function(o){function a(a){return{get:function(){return a},set:b}}function b(){}function c(){throw"Adguard: stopped a script execution.";}var d={},e=a(function(a){a(!1)}),f={},g=EventTarget.prototype.addEventListener;o(d,{spid_control_callback:a(b),content_control_callback:a(b),vid_control_callback:a(b)});o(f,{config:a(d),_setSpKey:{get:c,set:c},checkState:e,isAdBlocking:e,getSafeUri:a(function(a){return a}),pageChange:a(b),setupSmartBeacons:a(b)});Object.defineProperty(window,"_sp_",a(f));EventTarget.prototype.addEventListener=function(a){"sp.blocking"!=a&&"sp.not_blocking"!=a&&g.apply(this,arguments)}})(Object.defineProperties);': {
        uniqueId: "a1233e00aac3b1e9bd547e64ca938543",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.a1233e00aac3b1e9bd547e64ca938543 !== e) {
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
                        var c = {}, r = t((function(e) {
                            e(!1);
                        })), a = {}, i = EventTarget.prototype.addEventListener;
                        e(c, {
                            spid_control_callback: t(n),
                            content_control_callback: t(n),
                            vid_control_callback: t(n)
                        });
                        e(a, {
                            config: t(c),
                            _setSpKey: {
                                get: o,
                                set: o
                            },
                            checkState: r,
                            isAdBlocking: r,
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "a1233e00aac3b1e9bd547e64ca938543" due to: ' + e);
            }
        }
    },
    '(()=>{window.admiral=function(d,a,b){if("function"==typeof b)try{b({})}catch(a){}}})();': {
        uniqueId: "f27629071c2547fb2b0857e3b647320e",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.f27629071c2547fb2b0857e3b647320e !== e) {
                    window.admiral = function(e, t, o) {
                        if ("function" == typeof o) try {
                            o({});
                        } catch (t) {}
                    };
                    Object.defineProperty(Window.prototype.toString, "f27629071c2547fb2b0857e3b647320e", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "f27629071c2547fb2b0857e3b647320e" due to: ' + e);
            }
        }
    },
    '(()=>{const d={getUserConsentStatusForVendor:()=>!0};window.didomiOnReady=window.didomiOnReady||[],window.didomiOnReady.push=n=>{"function"==typeof n&&n(d)}})();': {
        uniqueId: "4f42a63fdc8f353f50712cbd342cc7be",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["4f42a63fdc8f353f50712cbd342cc7be"] !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "4f42a63fdc8f353f50712cbd342cc7be" due to: ' + e);
            }
        }
    },
    '(()=>{const e={apply:async(e,t,a)=>{if(a[0]&&a[0]?.match(/adsbygoogle|doubleclick|googlesyndication|static\\.cloudflareinsights\\.com\\/beacon\\.min\\.js/)){const e=(e="{}",t="",a="opaque")=>{const n=new Response(e,{statusText:"OK"}),o=String((s=50800,r=50900,Math.floor(Math.random()*(r-s+1)+s)));var s,r;return n.headers.set("Content-Length",o),Object.defineProperties(n,{type:{value:a},status:{value:0},statusText:{value:""},url:{value:""}}),Promise.resolve(n)};return e("{}",a[0])}return Reflect.apply(e,t,a)}};window.fetch=new Proxy(window.fetch,e)})();': {
        uniqueId: "9dbd26c8d0d4dcb61410c72cac73374e",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["9dbd26c8d0d4dcb61410c72cac73374e"] !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "9dbd26c8d0d4dcb61410c72cac73374e" due to: ' + e);
            }
        }
    },
    "window.ad_allowed = true;": {
        uniqueId: "049921132ffe411b4692a70bec90d335",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["049921132ffe411b4692a70bec90d335"] !== e) {
                    window.ad_allowed = !0;
                    Object.defineProperty(Window.prototype.toString, "049921132ffe411b4692a70bec90d335", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "049921132ffe411b4692a70bec90d335" due to: ' + e);
            }
        }
    },
    "(function(){var b=window.setTimeout;window.setTimeout=function(a,c){if(!/google_ads_frame/.test(a.toString()))return b(a,c)};})();": {
        uniqueId: "47f456fa4a14a6df26efb37ac4b35e9a",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["47f456fa4a14a6df26efb37ac4b35e9a"] !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "47f456fa4a14a6df26efb37ac4b35e9a" due to: ' + e);
            }
        }
    },
    'var _st = window.setTimeout; window.setTimeout = function(a, b) { if(!/var ad = document\\.querySelector\\("ins\\.adsbygoogle"\\);/.test(a)){ _st(a,b);}};': {
        uniqueId: "8468c20094b47b4c6230a90bb0cf2d54",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["8468c20094b47b4c6230a90bb0cf2d54"] !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "8468c20094b47b4c6230a90bb0cf2d54" due to: ' + e);
            }
        }
    },
    "document.avp_ready = 1;": {
        uniqueId: "1cd8368bac9abff3d844c605b628fee9",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["1cd8368bac9abff3d844c605b628fee9"] !== e) {
                    document.avp_ready = 1;
                    Object.defineProperty(Window.prototype.toString, "1cd8368bac9abff3d844c605b628fee9", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "1cd8368bac9abff3d844c605b628fee9" due to: ' + e);
            }
        }
    },
    "window.ADTECH = function() {};": {
        uniqueId: "e42f31b21c3855d599c00a3f8701ede6",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.e42f31b21c3855d599c00a3f8701ede6 !== e) {
                    window.ADTECH = function() {};
                    Object.defineProperty(Window.prototype.toString, "e42f31b21c3855d599c00a3f8701ede6", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "e42f31b21c3855d599c00a3f8701ede6" due to: ' + e);
            }
        }
    },
    "fuckAdBlock = function() {};": {
        uniqueId: "5c3f48e3f24ff8813da9609a53a72433",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["5c3f48e3f24ff8813da9609a53a72433"] !== e) {
                    fuckAdBlock = function() {};
                    Object.defineProperty(Window.prototype.toString, "5c3f48e3f24ff8813da9609a53a72433", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "5c3f48e3f24ff8813da9609a53a72433" due to: ' + e);
            }
        }
    },
    "window.IM = [1,2,3];": {
        uniqueId: "6e0b841e576ac763f81d5c219813906b",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["6e0b841e576ac763f81d5c219813906b"] !== e) {
                    window.IM = [ 1, 2, 3 ];
                    Object.defineProperty(Window.prototype.toString, "6e0b841e576ac763f81d5c219813906b", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "6e0b841e576ac763f81d5c219813906b" due to: ' + e);
            }
        }
    },
    "window.google_jobrunner = function() { };": {
        uniqueId: "c155982f45f07c347701b45fce31f5d3",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.c155982f45f07c347701b45fce31f5d3 !== e) {
                    window.google_jobrunner = function() {};
                    Object.defineProperty(Window.prototype.toString, "c155982f45f07c347701b45fce31f5d3", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "c155982f45f07c347701b45fce31f5d3" due to: ' + e);
            }
        }
    },
    "(function(){var c=window.setTimeout;window.setTimeout=function(f,g){return !Number.isNaN(g)&&/\\$\\('#l'\\+|#linkdiv/.test(f.toString())&&(g*=0.01),c.apply(this,arguments)}.bind(window)})();": {
        uniqueId: "009922e6198163d89edac4a47ce341c7",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["009922e6198163d89edac4a47ce341c7"] !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "009922e6198163d89edac4a47ce341c7" due to: ' + e);
            }
        }
    },
    "window.blockAdBlock = function() {};": {
        uniqueId: "7b0fe49ca4878b71af2e77dfe4259f5a",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["7b0fe49ca4878b71af2e77dfe4259f5a"] !== e) {
                    window.blockAdBlock = function() {};
                    Object.defineProperty(Window.prototype.toString, "7b0fe49ca4878b71af2e77dfe4259f5a", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "7b0fe49ca4878b71af2e77dfe4259f5a" due to: ' + e);
            }
        }
    },
    '!function(){const e={apply:(e,t,o)=>{const i=o[1];if(!i||"object"!=typeof i.QiyiPlayerProphetData)return Reflect.apply(e,t,o)}};window.Object.defineProperties=new Proxy(window.Object.defineProperties,e)}();': {
        uniqueId: "545a0289c2a1afd8dd9039c82074c2b7",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["545a0289c2a1afd8dd9039c82074c2b7"] !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "545a0289c2a1afd8dd9039c82074c2b7" due to: ' + e);
            }
        }
    },
    "!function(){const s={apply:(c,e,n)=>(n[0]?.adSlots&&(n[0].adSlots=[]),n[1]?.success&&(n[1].success=new Proxy(n[1].success,s)),Reflect.apply(c,e,n))};window.Object.assign=new Proxy(window.Object.assign,s)}();": {
        uniqueId: "7c9eb641391ed7a82e455b87f3672582",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["7c9eb641391ed7a82e455b87f3672582"] !== e) {
                    !function() {
                        const e = {
                            apply: (o, t, c) => (c[0]?.adSlots && (c[0].adSlots = []), c[1]?.success && (c[1].success = new Proxy(c[1].success, e)), 
                            Reflect.apply(o, t, c))
                        };
                        window.Object.assign = new Proxy(window.Object.assign, e);
                    }();
                    Object.defineProperty(Window.prototype.toString, "7c9eb641391ed7a82e455b87f3672582", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "7c9eb641391ed7a82e455b87f3672582" due to: ' + e);
            }
        }
    },
    'document.cookie="popup=9999999999999; path=/;";': {
        uniqueId: "dd5fb4eeed8b7505e5767b7045cb23cc",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.dd5fb4eeed8b7505e5767b7045cb23cc !== e) {
                    document.cookie = "popup=9999999999999; path=/;";
                    Object.defineProperty(Window.prototype.toString, "dd5fb4eeed8b7505e5767b7045cb23cc", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "dd5fb4eeed8b7505e5767b7045cb23cc" due to: ' + e);
            }
        }
    },
    'document.cookie="overlay-geschenk=donotshowfor7days; path=/;";': {
        uniqueId: "c244d6b503d07944e92dae676220ac14",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.c244d6b503d07944e92dae676220ac14 !== e) {
                    document.cookie = "overlay-geschenk=donotshowfor7days; path=/;";
                    Object.defineProperty(Window.prototype.toString, "c244d6b503d07944e92dae676220ac14", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "c244d6b503d07944e92dae676220ac14" due to: ' + e);
            }
        }
    },
    'document.cookie="popupSubscription=1; path=/;";': {
        uniqueId: "07e3ab9b26da8896b57fb83067364723",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["07e3ab9b26da8896b57fb83067364723"] !== e) {
                    document.cookie = "popupSubscription=1; path=/;";
                    Object.defineProperty(Window.prototype.toString, "07e3ab9b26da8896b57fb83067364723", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "07e3ab9b26da8896b57fb83067364723" due to: ' + e);
            }
        }
    },
    'document.cookie="hide_footer_login_layer=T; path=/;";': {
        uniqueId: "6610b2172699f352e936bdda56179645",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["6610b2172699f352e936bdda56179645"] !== e) {
                    document.cookie = "hide_footer_login_layer=T; path=/;";
                    Object.defineProperty(Window.prototype.toString, "6610b2172699f352e936bdda56179645", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "6610b2172699f352e936bdda56179645" due to: ' + e);
            }
        }
    },
    '!function(){const t={apply:(t,e,n)=>{if(n[0]&&"function"==typeof n[0])try{if(n[0].toString().includes("LOGIN_FORCE_TIME"))return}catch(t){console.trace(t)}return Reflect.apply(t,e,n)}},e=new Proxy(window.setTimeout,t);Object.defineProperty(window,"setTimeout",{set:function(){},get:function(){return e}})}();': {
        uniqueId: "af15a185bba3bf6f247f74549465a83e",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.af15a185bba3bf6f247f74549465a83e !== e) {
                    !function() {
                        const e = {
                            apply: (e, t, o) => {
                                if (o[0] && "function" == typeof o[0]) try {
                                    if (o[0].toString().includes("LOGIN_FORCE_TIME")) return;
                                } catch (e) {
                                    console.trace(e);
                                }
                                return Reflect.apply(e, t, o);
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "af15a185bba3bf6f247f74549465a83e" due to: ' + e);
            }
        }
    },
    "(function(){window.setTimeout=new Proxy(window.setTimeout,{apply:(a,b,c)=>c&&c[0]&&/SkipMsg\\(\\)/.test(c[0].toString())&&c[1]?(c[1]=1,Reflect.apply(a,b,c)):Reflect.apply(a,b,c)})})();": {
        uniqueId: "ddae51deac37af19fec2771965b890e1",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.ddae51deac37af19fec2771965b890e1 !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "ddae51deac37af19fec2771965b890e1" due to: ' + e);
            }
        }
    },
    'document.cookie="show_share=true; path=/;";': {
        uniqueId: "9fa386e4a7f5a25377523a2c743da6d9",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["9fa386e4a7f5a25377523a2c743da6d9"] !== e) {
                    document.cookie = "show_share=true; path=/;";
                    Object.defineProperty(Window.prototype.toString, "9fa386e4a7f5a25377523a2c743da6d9", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "9fa386e4a7f5a25377523a2c743da6d9" due to: ' + e);
            }
        }
    },
    '(function(){var a=new Date,b=a.getTime();document.cookie="ips4_bacalltoactionpopup="+b})();': {
        uniqueId: "21f664952df8e1eaf1fb9a92db8b174e",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["21f664952df8e1eaf1fb9a92db8b174e"] !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "21f664952df8e1eaf1fb9a92db8b174e" due to: ' + e);
            }
        }
    },
    "if (window.PushManager) { window.PushManager.prototype.subscribe = function () { return { then: function (func) { } }; }; }": {
        uniqueId: "f271f5a04b96c738d8491cb877889952",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.f271f5a04b96c738d8491cb877889952 !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "f271f5a04b96c738d8491cb877889952" due to: ' + e);
            }
        }
    },
    '(()=>{const t={construct:(t,e,n)=>{const r=e[0],o=r?.toString(),c=o?.includes("e[0].intersectionRatio");return c&&(e[0]=()=>{}),Reflect.construct(t,e,n)}};window.IntersectionObserver=new Proxy(window.IntersectionObserver,t)})();': {
        uniqueId: "c12b1283487b21a0e823718579c18ede",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.c12b1283487b21a0e823718579c18ede !== e) {
                    (() => {
                        const e = {
                            construct: (e, t, r) => {
                                const o = t[0], n = o?.toString(), c = n?.includes("e[0].intersectionRatio");
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "c12b1283487b21a0e823718579c18ede" due to: ' + e);
            }
        }
    },
    '(function(){var b=document.addEventListener;document.addEventListener=function(c,a,d){if(a&&-1==a.toString().indexOf("adsBlocked"))return b(c,a,d)}.bind(window)})();': {
        uniqueId: "62c4837e2d6ffab7f90fde5590cc73ab",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["62c4837e2d6ffab7f90fde5590cc73ab"] !== e) {
                    !function() {
                        var e = document.addEventListener;
                        document.addEventListener = function(t, n, o) {
                            if (n && -1 == n.toString().indexOf("adsBlocked")) return e(t, n, o);
                        }.bind(window);
                    }();
                    Object.defineProperty(Window.prototype.toString, "62c4837e2d6ffab7f90fde5590cc73ab", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "62c4837e2d6ffab7f90fde5590cc73ab" due to: ' + e);
            }
        }
    },
    '(function(b){Object.defineProperty(Element.prototype,"innerHTML",{get:function(){return b.get.call(this)},set:function(a){/^(?:<([abisuq]) id="[^"]*"><\\/\\1>)*$/.test(a)||b.set.call(this,a)},enumerable:!0,configurable:!0})})(Object.getOwnPropertyDescriptor(Element.prototype,"innerHTML"));': {
        uniqueId: "a45ed61db8e971a6cfde1b21ffc65573",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.a45ed61db8e971a6cfde1b21ffc65573 !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "a45ed61db8e971a6cfde1b21ffc65573" due to: ' + e);
            }
        }
    },
    '(function(a){Object.defineProperty(window,"upManager",{get:function(){return{push:a,register:a,fireNow:a,start:a}},set:function(a){if(!(a instanceof Error))throw Error();}})})(function(){});': {
        uniqueId: "e7cde92d3ed85b2159f3eefcc50b7ab6",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.e7cde92d3ed85b2159f3eefcc50b7ab6 !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "e7cde92d3ed85b2159f3eefcc50b7ab6" due to: ' + e);
            }
        }
    },
    '(function(){var b=XMLHttpRequest.prototype.open,c=/[/.@](piguiqproxy\\.com|rcdn\\.pro|amgload\\.net|dsn-fishki\\.ru|v6t39t\\.ru|greencuttlefish\\.com|rgy1wk\\.ru|vt4dlx\\.ru|d38dub\\.ru)[:/]/i;XMLHttpRequest.prototype.open=function(d,a){if("GET"===d&&c.test(a))this.send=function(){return null},this.setRequestHeader=function(){return null},console.log("AG has blocked request: ",a);else return b.apply(this,arguments)}})();': {
        uniqueId: "8d3f556a4543374ea8319bc03583025f",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["8d3f556a4543374ea8319bc03583025f"] !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "8d3f556a4543374ea8319bc03583025f" due to: ' + e);
            }
        }
    },
    '(function(){var b=XMLHttpRequest.prototype.open,c=/[/.@](piguiqproxy\\.com|rcdn\\.pro|amgload\\.net|dsn-fishki\\.ru|v6t39t\\.ru|greencuttlefish\\.com|rgy1wk\\.ru|vt4dlx\\.ru|d38dub\\.ru|csp-oz66pp\\.ru|ok9ydq\\.ru|kingoablc\\.com)[:/]/i;XMLHttpRequest.prototype.open=function(d,a){if("GET"===d&&c.test(a))this.send=function(){return null},this.setRequestHeader=function(){return null},console.log("AG has blocked request: ",a);else return b.apply(this,arguments)}})();': {
        uniqueId: "22514194ad8441cc56e68716b1f75f69",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["22514194ad8441cc56e68716b1f75f69"] !== e) {
                    !function() {
                        var e = XMLHttpRequest.prototype.open, t = /[/.@](piguiqproxy\.com|rcdn\.pro|amgload\.net|dsn-fishki\.ru|v6t39t\.ru|greencuttlefish\.com|rgy1wk\.ru|vt4dlx\.ru|d38dub\.ru|csp-oz66pp\.ru|ok9ydq\.ru|kingoablc\.com)[:/]/i;
                        XMLHttpRequest.prototype.open = function(o, r) {
                            if ("GET" !== o || !t.test(r)) return e.apply(this, arguments);
                            this.send = function() {
                                return null;
                            }, this.setRequestHeader = function() {
                                return null;
                            }, console.log("AG has blocked request: ", r);
                        };
                    }();
                    Object.defineProperty(Window.prototype.toString, "22514194ad8441cc56e68716b1f75f69", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "22514194ad8441cc56e68716b1f75f69" due to: ' + e);
            }
        }
    },
    '(()=>{const e={breakStatus:"done"},o=["beforeReward","adViewed","adBreakDone"];window.adsbygoogle=window.adsbygoogle||[],window.adsbygoogle.push=function(d){var a;d&&"object"==typeof d&&(a=d,o.every((e=>e in a&&"function"==typeof a[e])))&&(d.beforeReward(),d.adViewed(),d.adBreakDone(e))}})();': {
        uniqueId: "36fd3167269f896e4009a009ae54edb3",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["36fd3167269f896e4009a009ae54edb3"] !== e) {
                    (() => {
                        const e = {
                            breakStatus: "done"
                        }, o = [ "beforeReward", "adViewed", "adBreakDone" ];
                        window.adsbygoogle = window.adsbygoogle || [], window.adsbygoogle.push = function(d) {
                            var r;
                            d && "object" == typeof d && (r = d, o.every((e => e in r && "function" == typeof r[e]))) && (d.beforeReward(), 
                            d.adViewed(), d.adBreakDone(e));
                        };
                    })();
                    Object.defineProperty(Window.prototype.toString, "36fd3167269f896e4009a009ae54edb3", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "36fd3167269f896e4009a009ae54edb3" due to: ' + e);
            }
        }
    },
    '(()=>{document.addEventListener(\'DOMContentLoaded\',()=>{const t=document.querySelector(\'a[href*="uploadmall.com/cgi-bin/dl.cgi/"]\');if(t){const e=t.getAttribute("href");t.addEventListener("click",(t=>{try{const t=`{"link":"${e}"}`,c=`https://mendationforc.info/?cc=${btoa(t)}`;window.open(c)}catch(t){console.debug(t)}}))}})})();': {
        uniqueId: "0c91eaeaf0d6e2a52ab9be668bbd08a5",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["0c91eaeaf0d6e2a52ab9be668bbd08a5"] !== e) {
                    document.addEventListener("DOMContentLoaded", (() => {
                        const e = document.querySelector('a[href*="uploadmall.com/cgi-bin/dl.cgi/"]');
                        if (e) {
                            const t = e.getAttribute("href");
                            e.addEventListener("click", (e => {
                                try {
                                    const e = `{"link":"${t}"}`, o = `https://mendationforc.info/?cc=${btoa(e)}`;
                                    window.open(o);
                                } catch (e) {
                                    console.debug(e);
                                }
                            }));
                        }
                    }));
                    Object.defineProperty(Window.prototype.toString, "0c91eaeaf0d6e2a52ab9be668bbd08a5", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "0c91eaeaf0d6e2a52ab9be668bbd08a5" due to: ' + e);
            }
        }
    },
    '(()=>{const e={apply:(e,n,t)=>{const o=t[1];return o&&["adBlockingDetected","assessAdBlocking"].includes(o)&&t[2]&&"function"==typeof t[2].value&&(t[2].value=()=>{}),Reflect.apply(e,n,t)}};window.Object.defineProperty=new Proxy(window.Object.defineProperty,e)})();': {
        uniqueId: "dd013aac8504d0cebb16580d054020f6",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.dd013aac8504d0cebb16580d054020f6 !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "dd013aac8504d0cebb16580d054020f6" due to: ' + e);
            }
        }
    },
    "(()=>{const e=()=>{};window.powerTag={Init:[]},window.powerTag.Init.push=function(e){try{e()}catch(e){console.debug(e)}},window.powerAPITag={initRewarded:function(e,o){o&&o.onComplete&&setTimeout((()=>{try{o.onComplete()}catch(e){console.debug(e)}}),1e3)},display:e,mobileDetect:e,initStickyBanner:e,getRewardedAd:e}})();": {
        uniqueId: "208df12815c78a46fb392dc8afb56295",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["208df12815c78a46fb392dc8afb56295"] !== e) {
                    (() => {
                        const e = () => {};
                        window.powerTag = {
                            Init: []
                        }, window.powerTag.Init.push = function(e) {
                            try {
                                e();
                            } catch (e) {
                                console.debug(e);
                            }
                        }, window.powerAPITag = {
                            initRewarded: function(e, o) {
                                o && o.onComplete && setTimeout((() => {
                                    try {
                                        o.onComplete();
                                    } catch (e) {
                                        console.debug(e);
                                    }
                                }), 1e3);
                            },
                            display: e,
                            mobileDetect: e,
                            initStickyBanner: e,
                            getRewardedAd: e
                        };
                    })();
                    Object.defineProperty(Window.prototype.toString, "208df12815c78a46fb392dc8afb56295", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "208df12815c78a46fb392dc8afb56295" due to: ' + e);
            }
        }
    },
    '(()=>{const t={apply:(t,n,e)=>{if(e[0]&&null===e[0].html?.detected&&"function"==typeof e[0].html?.instance?.start&&"function"==typeof e[0].env?.instance?.start&&"function"==typeof e[0].http?.instance?.start){const t=function(){Object.keys(this).forEach((t=>{"boolean"==typeof this[t]&&(this[t]=!1)}))};["html","env","http"].forEach((n=>{e[0][n].instance.start=t}))}return Reflect.apply(t,n,e)}};window.Object.keys=new Proxy(window.Object.keys,t)})();': {
        uniqueId: "8e5af140bb8ff6dfac87d2aa8a7181a7",
        func: () => {
            try {
                const t = "done";
                if (Window.prototype.toString["8e5af140bb8ff6dfac87d2aa8a7181a7"] !== t) {
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
                }
            } catch (t) {
                console.error('Error executing AG js rule with uniqueId "8e5af140bb8ff6dfac87d2aa8a7181a7" due to: ' + t);
            }
        }
    },
    "(()=>{document.addEventListener('DOMContentLoaded',()=>{var el=document.body; var ce=document.createElement('div'); if(el) { el.appendChild(ce); ce.setAttribute(\"id\", \"QGSBETJjtZkYH\"); }})})();": {
        uniqueId: "660d8dc0098c8febc0f6d884977e6d4e",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["660d8dc0098c8febc0f6d884977e6d4e"] !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "660d8dc0098c8febc0f6d884977e6d4e" due to: ' + e);
            }
        }
    },
    '(()=>{document.addEventListener(\'DOMContentLoaded\',()=>{const e=document.querySelector("#widescreen1");if(e){const t=document.createElement("div");t.setAttribute("id","google_ads_iframe_"),e.appendChild(t)}})})();': {
        uniqueId: "44c722190e3d03dbed05660dc5040600",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["44c722190e3d03dbed05660dc5040600"] !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "44c722190e3d03dbed05660dc5040600" due to: ' + e);
            }
        }
    },
    '(()=>{const e=new Set(["fimg","faimg","fbmg","fcmg","fdmg","femg","ffmg","fgmg","fjmg","fkmg"]),t={apply:(t,c,n)=>{const s=n[2];if(s){const t=Object.keys(s).length;if(t>1&&t<20)for(let t in s)if(e.has(t)&&!0===n[2][t])try{n[2][t]=!1}catch(e){console.trace(e)}else if(!0===s[t])try{const e=(new Error).stack;/NodeList\\.forEach|(<anonymous>|blob):[\\s\\S]{1,500}$/.test(e)&&(s[t]=!1)}catch(e){console.trace(e)}}return Reflect.apply(t,c,n)}};window.Object.assign=new Proxy(window.Object.assign,t)})();': {
        uniqueId: "26f59c9e189170e8d303a40a632b2e28",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["26f59c9e189170e8d303a40a632b2e28"] !== e) {
                    (() => {
                        const e = new Set([ "fimg", "faimg", "fbmg", "fcmg", "fdmg", "femg", "ffmg", "fgmg", "fjmg", "fkmg" ]), t = {
                            apply: (t, o, n) => {
                                const c = n[2];
                                if (c) {
                                    const t = Object.keys(c).length;
                                    if (t > 1 && t < 20) for (let t in c) if (e.has(t) && !0 === n[2][t]) try {
                                        n[2][t] = !1;
                                    } catch (e) {
                                        console.trace(e);
                                    } else if (!0 === c[t]) try {
                                        const e = (new Error).stack;
                                        /NodeList\.forEach|(<anonymous>|blob):[\s\S]{1,500}$/.test(e) && (c[t] = !1);
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "26f59c9e189170e8d303a40a632b2e28" due to: ' + e);
            }
        }
    },
    '(()=>{const e={apply:(e,t,p)=>{const o=p[1];return o&&"string"==typeof o&&o.match(/pagead2\\.googlesyndication\\.com|google.*\\.js|\\/.*?\\/.*?ad.*?\\.js|\\.(shop|quest|autos)\\/.*?\\.(js|php|html)/)&&(t.prevent=!0),Reflect.apply(e,t,p)}};window.XMLHttpRequest.prototype.open=new Proxy(window.XMLHttpRequest.prototype.open,e);const t={apply:(e,t,p)=>{if(!t.prevent)return Reflect.apply(e,t,p)}};window.XMLHttpRequest.prototype.send=new Proxy(window.XMLHttpRequest.prototype.send,t)})();': {
        uniqueId: "c7605ee2684a2146beda3b04ccfa8bec",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.c7605ee2684a2146beda3b04ccfa8bec !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "c7605ee2684a2146beda3b04ccfa8bec" due to: ' + e);
            }
        }
    },
    '(()=>{const e=()=>{document.querySelectorAll(".chakra-portal").forEach((e=>{e.querySelector(\'.chakra-modal__overlay[style*="opacity"]\')&&e.setAttribute("style","display: none !important;")}))},t=()=>{},a=function(t,a){const r={name:t,listener:a};requestAnimationFrame((()=>{try{"rewardedSlotGranted"===r.name&&setTimeout(e,2e3),r.listener()}catch(e){}}))};window.googletag={cmd:[],pubads:()=>({addEventListener:a,removeEventListener:t,refresh:t,getTargeting:()=>[],setTargeting:t,disableInitialLoad:t,enableSingleRequest:t,collapseEmptyDivs:t,getSlots:t}),defineSlot:()=>({addService(){}}),defineOutOfPageSlot:t,enableServices:t,display:t,enums:{OutOfPageFormat:{REWARDED:1}}},googletag.cmd.push=e=>{try{e()}catch(e){}return 1}})();': {
        uniqueId: "788553a11ab6cd27600ce601f07d7af8",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["788553a11ab6cd27600ce601f07d7af8"] !== e) {
                    (() => {
                        const e = () => {
                            document.querySelectorAll(".chakra-portal").forEach((e => {
                                e.querySelector('.chakra-modal__overlay[style*="opacity"]') && e.setAttribute("style", "display: none !important;");
                            }));
                        }, t = () => {}, a = function(t, a) {
                            const r = {
                                name: t,
                                listener: a
                            };
                            requestAnimationFrame((() => {
                                try {
                                    "rewardedSlotGranted" === r.name && setTimeout(e, 2e3), r.listener();
                                } catch (e) {}
                            }));
                        };
                        window.googletag = {
                            cmd: [],
                            pubads: () => ({
                                addEventListener: a,
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "788553a11ab6cd27600ce601f07d7af8" due to: ' + e);
            }
        }
    },
    '(()=>{document.addEventListener(\'DOMContentLoaded\',()=>{if(window.CryptoJSAesJson&&window.CryptoJSAesJson.decrypt){const e=document.createElement("link");function t(){const t=document.querySelector(".entry-header.header");return parseInt(t.getAttribute("data-id"))}e.setAttribute("rel","stylesheet"),e.setAttribute("media","all"),e.setAttribute("href","/wp-content/cache/autoptimize/css/autoptimize_92c5b1cf0217cba9b3fab27d39f320b9.css"),document.head.appendChild(e);const r=3,n=5,o=13,a="07";let c="",i="";const d=1,l=6,g=1,s=5,u=2,p=8,m=8,A=(t,e)=>parseInt(t.toString()+e.toString()),b=(t,e,r)=>t.toString()+e.toString()+r.toString(),S=()=>{const e=document.querySelectorAll(".reading-content .page-break img").length;let c=parseInt((t()+A(o,a))*r-e);return c=A(2*n+1,c),c},h=()=>{const e=document.querySelectorAll(".reading-content .page-break img").length;let r=parseInt((t()+A(p,m))*(2*d)-e-(2*d*2+1));return r=b(2*l+g+g+1,c,r),r},y=()=>{const e=document.querySelectorAll(".reading-content .page-break img").length;return b(t()+2*s*2,i,e*(2*u))},f=(t,e)=>CryptoJSAesJson.decrypt(t,e);let k=document.querySelectorAll(".reading-content .page-break img");k.forEach((t=>{const e=t.getAttribute("id"),r=f(e,S().toString());t.setAttribute("id",r)})),k=document.querySelectorAll(".reading-content .page-break img"),k.forEach((t=>{const e=t.getAttribute("id"),r=parseInt(e.replace(/image-(\\d+)[a-z]+/i,"$1"));document.querySelectorAll(".reading-content .page-break")[r].appendChild(t)})),k=document.querySelectorAll(".reading-content .page-break img"),k.forEach((t=>{const e=t.getAttribute("id"),r=e.slice(-1);c+=r,t.setAttribute("id",e.slice(0,-1))})),k=document.querySelectorAll(".reading-content .page-break img"),k.forEach((t=>{const e=t.getAttribute("dta"),r=f(e,h().toString());t.setAttribute("dta",r)})),k=document.querySelectorAll(".reading-content .page-break img"),k.forEach((t=>{const e=t.getAttribute("dta").slice(-2);i+=e,t.removeAttribute("dta")})),k.forEach((t=>{var e=t.getAttribute("data-src"),r=f(e,y().toString());t.setAttribute("data-src",r)})),k.forEach((t=>{t.classList.add("wp-manga-chapter-img","img-responsive","lazyload","effect-fade")}))}})})();': {
        uniqueId: "793501cfe6b6465e5f629489b079c172",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["793501cfe6b6465e5f629489b079c172"] !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "793501cfe6b6465e5f629489b079c172" due to: ' + e);
            }
        }
    },
    '(()=>{const e=new Map,t=function(){},o=t;o.prototype.dispose=t,o.prototype.setNetwork=t,o.prototype.resize=t,o.prototype.setServer=t,o.prototype.setLogLevel=t,o.prototype.newContext=function(){return this},o.prototype.setParameter=t,o.prototype.addEventListener=function(t,o){t&&(console.debug(`Type: ${t}, callback: ${o}`),e.set(t,o))},o.prototype.removeEventListener=t,o.prototype.setProfile=t,o.prototype.setCapability=t,o.prototype.setVideoAsset=t,o.prototype.setSiteSection=t,o.prototype.addKeyValue=t,o.prototype.addTemporalSlot=t,o.prototype.registerCustomPlayer=t,o.prototype.setVideoDisplaySize=t,o.prototype.setContentVideoElement=t,o.prototype.registerVideoDisplayBase=t,o.prototype.submitRequest=function(){const t={type:tv.freewheel.SDK.EVENT_SLOT_ENDED},o=e.get("EVENT_SLOT_ENDED");o&&setTimeout((()=>{try{o(t)}catch(e){console.error(e)}}),1)},window.tv={freewheel:{SDK:{Ad:t,AdManager:o,AdListener:t,_instanceQueue:{},setLogLevel:t,EVENT_SLOT_ENDED:"EVENT_SLOT_ENDED"}}}})();': {
        uniqueId: "75be2f053259701edcb277b5ff24cd28",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["75be2f053259701edcb277b5ff24cd28"] !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "75be2f053259701edcb277b5ff24cd28" due to: ' + e);
            }
        }
    },
    '(()=>{const e=window.Promise,o={construct:(o,t,n)=>t[0]&&t[0]?.toString()?.includes("[!1,!1,!1,!1]")&&t[0]?.toString()?.includes(".responseText")?e.resolve(!1):Reflect.construct(o,t,n)},t=new Proxy(window.Promise,o);Object.defineProperty(window,"Promise",{set:e=>{},get:()=>t})})();': {
        uniqueId: "4e4e57eff747aed19b1eb6c7b2758126",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["4e4e57eff747aed19b1eb6c7b2758126"] !== e) {
                    (() => {
                        const e = window.Promise, o = {
                            construct: (o, t, r) => t[0] && t[0]?.toString()?.includes("[!1,!1,!1,!1]") && t[0]?.toString()?.includes(".responseText") ? e.resolve(!1) : Reflect.construct(o, t, r)
                        }, t = new Proxy(window.Promise, o);
                        Object.defineProperty(window, "Promise", {
                            set: e => {},
                            get: () => t
                        });
                    })();
                    Object.defineProperty(Window.prototype.toString, "4e4e57eff747aed19b1eb6c7b2758126", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "4e4e57eff747aed19b1eb6c7b2758126" due to: ' + e);
            }
        }
    },
    'function preventError(d){window.addEventListener("error",function(a){if(a.srcElement&&a.srcElement.src){const b=new RegExp(d);b.test(a.srcElement.src)&&(a.srcElement.onerror=function(){})}},!0)}preventError("^.");': {
        uniqueId: "7077cdb2f51824b7fa18efed539eb3b4",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["7077cdb2f51824b7fa18efed539eb3b4"] !== e) {
                    function preventError(e) {
                        window.addEventListener("error", (function(r) {
                            if (r.srcElement && r.srcElement.src) {
                                new RegExp(e).test(r.srcElement.src) && (r.srcElement.onerror = function() {});
                            }
                        }), !0);
                    }
                    preventError("^.");
                    Object.defineProperty(Window.prototype.toString, "7077cdb2f51824b7fa18efed539eb3b4", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (r) {
                console.error('Error executing AG js rule with uniqueId "7077cdb2f51824b7fa18efed539eb3b4" due to: ' + r);
            }
        }
    },
    "(()=>{window.viAPItag={init(){}}})();": {
        uniqueId: "88012e776a891c545cc6e77db0f643af",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["88012e776a891c545cc6e77db0f643af"] !== e) {
                    window.viAPItag = {
                        init() {}
                    };
                    Object.defineProperty(Window.prototype.toString, "88012e776a891c545cc6e77db0f643af", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "88012e776a891c545cc6e77db0f643af" due to: ' + e);
            }
        }
    },
    '(()=>{document.addEventListener("DOMContentLoaded",(()=>{ "function"==typeof ViewModelBase&&"object"==typeof ViewModelBase.prototype&&"function"==typeof ViewModelBase.prototype.LoadBrandAdAsync&&(ViewModelBase.prototype.LoadBrandAdAsync=function(){}) }));})();': {
        uniqueId: "ac3452ef83db17c4e84323d15083a03b",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.ac3452ef83db17c4e84323d15083a03b !== e) {
                    document.addEventListener("DOMContentLoaded", (() => {
                        "function" == typeof ViewModelBase && "object" == typeof ViewModelBase.prototype && "function" == typeof ViewModelBase.prototype.LoadBrandAdAsync && (ViewModelBase.prototype.LoadBrandAdAsync = function() {});
                    }));
                    Object.defineProperty(Window.prototype.toString, "ac3452ef83db17c4e84323d15083a03b", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "ac3452ef83db17c4e84323d15083a03b" due to: ' + e);
            }
        }
    },
    '(()=>{document.addEventListener("DOMContentLoaded",(()=>{ var a=document.querySelectorAll("ins.adsbygoogle");a.length&&a.forEach(a=>{var b=document.createElement("iframe");b.style="display: none !important;",a.setAttribute("data-ad-status","filled"),a.appendChild(b)}) }));})();': {
        uniqueId: "81b55e3b01cb8f931036cccb4d1056b6",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["81b55e3b01cb8f931036cccb4d1056b6"] !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "81b55e3b01cb8f931036cccb4d1056b6" due to: ' + e);
            }
        }
    },
    '(function(){window.adnPopConfig={zoneId:"149"}})();': {
        uniqueId: "cdb400a346ffb8cf37f33a522644f2cb",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.cdb400a346ffb8cf37f33a522644f2cb !== e) {
                    window.adnPopConfig = {
                        zoneId: "149"
                    };
                    Object.defineProperty(Window.prototype.toString, "cdb400a346ffb8cf37f33a522644f2cb", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "cdb400a346ffb8cf37f33a522644f2cb" due to: ' + e);
            }
        }
    },
    '!function(){window.adsbygoogle={loaded:!0,push:function(){"undefined"===typeof this.length&&(this.length=0,this.length+=1)}}}();': {
        uniqueId: "065d3c28da0404a4fdfd569932271571",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["065d3c28da0404a4fdfd569932271571"] !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "065d3c28da0404a4fdfd569932271571" due to: ' + e);
            }
        }
    },
    '(()=>{document.addEventListener("DOMContentLoaded",(()=>{ var b=new MutationObserver(function(){try{for(var a,d=function(c){for(var a="",d=0;d<c;d++)a+="0123456789".charAt(Math.floor(10*Math.random()));return a},e=document.querySelectorAll(".adsbygoogle, script[data-ad-client]"),f=0;f<e.length;f++)if(e[f].getAttribute("data-ad-client")){a=e[f].getAttribute("data-ad-client");break}if(a){var g=`<ins class="adsbygoogle" data-adsbygoogle-status="done" style="display: block; height: 200px; width: 200px;" data-ad-status="unfilled"><ins id="aswift_0_expand" style="border: none; height: 0px; width: 0px; margin: 0px; padding: 0px; position: relative; visibility: visible; background-color: transparent; display: inline-table;" tabindex="0" title="Advertisement" aria-label="Advertisement"><ins id="aswift_0_anchor" style="border: none; height: 0px; width: 0px; margin: 0px; padding: 0px; position: relative; visibility: visible; background-color: transparent; display: block;"><iframe id="aswift_0" name="aswift_0" style="left:0;position:absolute;top:0;border:0;width:200px;height:200px;" sandbox="allow-forms allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts allow-top-navigation-by-user-activation" frameborder="0" src="https://googleads.g.doubleclick.net/pagead/ads?client=${a}&amp;output=html&amp;adk=${d(10)}&amp;adf=${d(10)}&amp;lmt=${d(10)}&amp;plat=${d(100)};&amp;format=0x0&amp;url=${encodeURIComponent(document.location.href)}&amp;ea=0&amp;flash=0&amp;pra=5&amp;wgl=1&amp;uach=${d(100)}&amp;bpp=2&amp;bdt=${d(3)}&amp;idt=${d(3)}&amp;shv=r${d(8)}&amp;mjsv=m${d(8)}&amp;ptt=${d(1)}&amp;saldr=aa&amp;abxe=1&amp;nras=1&amp;correlator=${d(8)}&amp;frm=${d(2)}&amp;pv=2&amp;ga_vid=${d(10)}.${d(10)}&amp;ga_sid=${d(10)}&amp;ga_hid=${d(10)}&amp;ga_fc=0&amp;u_tz=${d(3)}&amp;u_his=8&amp;u_java=0&amp;u_h=${d(4)}&amp;u_w=${d(4)}&amp;u_ah=${d(4)}&amp;u_aw=${d(4)}&amp;u_cd=${d(2)}&amp;u_nplug=${d(1)}&amp;u_nmime=${d(1)}&amp;adx=-${d(8)}&amp;ady=-${d(8)}&amp;biw=${d(4)}&amp;bih=${d(4)}&amp;scr_x=0&amp;scr_y=0&amp;eid=${d(30)}&amp;oid=${d(1)}&amp;pvsid=${d(16)}&amp;pem=${d(3)}&amp;eae=${d(1)}&amp;fc=${d(4)}&amp;brdim=${d(20)}&amp;vis=1&amp;rsz=${d(6)}&amp;abl=NS&amp;fu=${d(4)}&amp;bc=${d(2)}&amp;ifi=1&amp;uci=a!1&amp;fsb=1&amp;dtd=128" marginwidth="0" marginheight="0" vspace="0" hspace="0" allowtransparency="true" scrolling="no" allowfullscreen="true" data-google-container-id="a!1" data-load-complete="true"></iframe></ins></ins></ins>`,h=document.querySelector("body > *"),j=document.querySelectorAll(".phpbb-ads-center > .adsbygoogle");h&&j.length&&(!h.querySelector("iframe#aswift_0")&&h.insertAdjacentHTML("afterend",g),j.forEach(a=>{a.querySelector("iframe#aswift_0")||(a.parentNode.style.height="200px",a.parentNode.style.width="200px",a.parentNode.innerHTML=g)}))}var k=document.querySelector(".page-body"),l=document.querySelectorAll(".adsbygoogle, .phpbb-ads-center");k&&!k.innerText.includes("deactivating your Ad-Blocker")&&l.length&&(l.forEach(a=>{a.remove()}),b.disconnect())}catch(a){}});b.observe(document,{childList:!0,subtree:!0}),setTimeout(function(){b.disconnect()},1E4) }));})();': {
        uniqueId: "802366024dd441867900263826a1b687",
        func: () => {
            try {
                const a = "done";
                if (Window.prototype.toString["802366024dd441867900263826a1b687"] !== a) {
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
                                    var p = `<ins class="adsbygoogle" data-adsbygoogle-status="done" style="display: block; height: 200px; width: 200px;" data-ad-status="unfilled"><ins id="aswift_0_expand" style="border: none; height: 0px; width: 0px; margin: 0px; padding: 0px; position: relative; visibility: visible; background-color: transparent; display: inline-table;" tabindex="0" title="Advertisement" aria-label="Advertisement"><ins id="aswift_0_anchor" style="border: none; height: 0px; width: 0px; margin: 0px; padding: 0px; position: relative; visibility: visible; background-color: transparent; display: block;"><iframe id="aswift_0" name="aswift_0" style="left:0;position:absolute;top:0;border:0;width:200px;height:200px;" sandbox="allow-forms allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts allow-top-navigation-by-user-activation" frameborder="0" src="https://googleads.g.doubleclick.net/pagead/ads?client=${e}&amp;output=html&amp;adk=${t(10)}&amp;adf=${t(10)}&amp;lmt=${t(10)}&amp;plat=${t(100)};&amp;format=0x0&amp;url=${encodeURIComponent(document.location.href)}&amp;ea=0&amp;flash=0&amp;pra=5&amp;wgl=1&amp;uach=${t(100)}&amp;bpp=2&amp;bdt=${t(3)}&amp;idt=${t(3)}&amp;shv=r${t(8)}&amp;mjsv=m${t(8)}&amp;ptt=${t(1)}&amp;saldr=aa&amp;abxe=1&amp;nras=1&amp;correlator=${t(8)}&amp;frm=${t(2)}&amp;pv=2&amp;ga_vid=${t(10)}.${t(10)}&amp;ga_sid=${t(10)}&amp;ga_hid=${t(10)}&amp;ga_fc=0&amp;u_tz=${t(3)}&amp;u_his=8&amp;u_java=0&amp;u_h=${t(4)}&amp;u_w=${t(4)}&amp;u_ah=${t(4)}&amp;u_aw=${t(4)}&amp;u_cd=${t(2)}&amp;u_nplug=${t(1)}&amp;u_nmime=${t(1)}&amp;adx=-${t(8)}&amp;ady=-${t(8)}&amp;biw=${t(4)}&amp;bih=${t(4)}&amp;scr_x=0&amp;scr_y=0&amp;eid=${t(30)}&amp;oid=${t(1)}&amp;pvsid=${t(16)}&amp;pem=${t(3)}&amp;eae=${t(1)}&amp;fc=${t(4)}&amp;brdim=${t(20)}&amp;vis=1&amp;rsz=${t(6)}&amp;abl=NS&amp;fu=${t(4)}&amp;bc=${t(2)}&amp;ifi=1&amp;uci=a!1&amp;fsb=1&amp;dtd=128" marginwidth="0" marginheight="0" vspace="0" hspace="0" allowtransparency="true" scrolling="no" allowfullscreen="true" data-google-container-id="a!1" data-load-complete="true"></iframe></ins></ins></ins>`, r = document.querySelector("body > *"), n = document.querySelectorAll(".phpbb-ads-center > .adsbygoogle");
                                    r && n.length && (!r.querySelector("iframe#aswift_0") && r.insertAdjacentHTML("afterend", p), 
                                    n.forEach((a => {
                                        a.querySelector("iframe#aswift_0") || (a.parentNode.style.height = "200px", a.parentNode.style.width = "200px", 
                                        a.parentNode.innerHTML = p);
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
                }
            } catch (a) {
                console.error('Error executing AG js rule with uniqueId "802366024dd441867900263826a1b687" due to: ' + a);
            }
        }
    },
    "window.adsbygoogle = { loaded: !0 };": {
        uniqueId: "df4e0801aa685812f605b6558f08d2df",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.df4e0801aa685812f605b6558f08d2df !== e) {
                    window.adsbygoogle = {
                        loaded: !0
                    };
                    Object.defineProperty(Window.prototype.toString, "df4e0801aa685812f605b6558f08d2df", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "df4e0801aa685812f605b6558f08d2df" due to: ' + e);
            }
        }
    },
    '!function(){const e={apply:(e,l,t)=>{const o=t[0];return o?.includes(".b_ad,")?t[0]="#b_results":o?.includes(".b_restorableLink")&&(t[0]=".b_algo"),Reflect.apply(e,l,t)}};window.Element.prototype.querySelectorAll=new Proxy(window.Element.prototype.querySelectorAll,e)}();': {
        uniqueId: "009a684340d0a5680676bfe531438c9e",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["009a684340d0a5680676bfe531438c9e"] !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "009a684340d0a5680676bfe531438c9e" due to: ' + e);
            }
        }
    },
    "(function(){var b=window.setTimeout;window.setTimeout=function(a,c){if(!/\\]\\.bab\\(window/.test(a.toString()))return b(a,c)};})();": {
        uniqueId: "346833de4a18e6e5f53bde8d214083c7",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["346833de4a18e6e5f53bde8d214083c7"] !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "346833de4a18e6e5f53bde8d214083c7" due to: ' + e);
            }
        }
    },
    '(function(){var b=window.addEventListener;window.addEventListener=function(c,a,d){if(a&&-1==a.toString().indexOf("adblocker"))return b(c,a,d)}.bind(window)})();': {
        uniqueId: "3c94e62d04214a62e1bf1be209aed83b",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["3c94e62d04214a62e1bf1be209aed83b"] !== e) {
                    !function() {
                        var e = window.addEventListener;
                        window.addEventListener = function(n, t, o) {
                            if (t && -1 == t.toString().indexOf("adblocker")) return e(n, t, o);
                        }.bind(window);
                    }();
                    Object.defineProperty(Window.prototype.toString, "3c94e62d04214a62e1bf1be209aed83b", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "3c94e62d04214a62e1bf1be209aed83b" due to: ' + e);
            }
        }
    },
    "(function(){var b=window.setInterval;window.setInterval=function(a,c){if(!/.\\.display=='hidden'[\\s\\S]*?.\\.visibility=='none'/.test(a.toString()))return b(a,c)}.bind(window)})();": {
        uniqueId: "2610380c7215f8ed3dab7859b677c07e",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["2610380c7215f8ed3dab7859b677c07e"] !== e) {
                    !function() {
                        var e = window.setInterval;
                        window.setInterval = function(t, n) {
                            if (!/.\.display=='hidden'[\s\S]*?.\.visibility=='none'/.test(t.toString())) return e(t, n);
                        }.bind(window);
                    }();
                    Object.defineProperty(Window.prototype.toString, "2610380c7215f8ed3dab7859b677c07e", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "2610380c7215f8ed3dab7859b677c07e" due to: ' + e);
            }
        }
    },
    "(function(){var b=window.setInterval;window.setInterval=function(a,c){if(!/e\\.display=='hidden'[\\s\\S]*?e\\.visibility=='none'/.test(a.toString()))return b(a,c)}.bind(window)})();": {
        uniqueId: "799170846df78b2e8c6f8f1ecbe9f9ab",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["799170846df78b2e8c6f8f1ecbe9f9ab"] !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "799170846df78b2e8c6f8f1ecbe9f9ab" due to: ' + e);
            }
        }
    },
    "window.cRAds = !0;": {
        uniqueId: "05f59c5992059f458f16aa93e814a859",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["05f59c5992059f458f16aa93e814a859"] !== e) {
                    window.cRAds = !0;
                    Object.defineProperty(Window.prototype.toString, "05f59c5992059f458f16aa93e814a859", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "05f59c5992059f458f16aa93e814a859" due to: ' + e);
            }
        }
    },
    "window.spoof_weer2edasfgeefzc = true;": {
        uniqueId: "f383cd371dd44d7f9a6f53a66c468020",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.f383cd371dd44d7f9a6f53a66c468020 !== e) {
                    window.spoof_weer2edasfgeefzc = !0;
                    Object.defineProperty(Window.prototype.toString, "f383cd371dd44d7f9a6f53a66c468020", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "f383cd371dd44d7f9a6f53a66c468020" due to: ' + e);
            }
        }
    },
    "window.$tieE3 = true;": {
        uniqueId: "abf848581aab7ee411a3a190d6305e9f",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.abf848581aab7ee411a3a190d6305e9f !== e) {
                    window.$tieE3 = !0;
                    Object.defineProperty(Window.prototype.toString, "abf848581aab7ee411a3a190d6305e9f", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "abf848581aab7ee411a3a190d6305e9f" due to: ' + e);
            }
        }
    },
    "window.adblock = 'no';": {
        uniqueId: "c6ea598841fd47b4e64cb41f4a71cde9",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.c6ea598841fd47b4e64cb41f4a71cde9 !== e) {
                    window.adblock = "no";
                    Object.defineProperty(Window.prototype.toString, "c6ea598841fd47b4e64cb41f4a71cde9", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "c6ea598841fd47b4e64cb41f4a71cde9" due to: ' + e);
            }
        }
    },
    "window.cRAds = true;": {
        uniqueId: "da58e3a13e69cfd89e4776e3804f29da",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.da58e3a13e69cfd89e4776e3804f29da !== e) {
                    window.cRAds = !0;
                    Object.defineProperty(Window.prototype.toString, "da58e3a13e69cfd89e4776e3804f29da", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "da58e3a13e69cfd89e4776e3804f29da" due to: ' + e);
            }
        }
    },
    "window.Advertisement = 1;": {
        uniqueId: "a77fad03c24e228b97652a46d1fa5f22",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.a77fad03c24e228b97652a46d1fa5f22 !== e) {
                    window.Advertisement = 1;
                    Object.defineProperty(Window.prototype.toString, "a77fad03c24e228b97652a46d1fa5f22", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "a77fad03c24e228b97652a46d1fa5f22" due to: ' + e);
            }
        }
    },
    "(function(){var b=window.setTimeout;window.setTimeout=function(a,c){if(!/getAdIFrameCount/.test(a.toString()))return b(a,c)};})();": {
        uniqueId: "0f751b2f4dfde1f99c0f6624f4bb7d2e",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["0f751b2f4dfde1f99c0f6624f4bb7d2e"] !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "0f751b2f4dfde1f99c0f6624f4bb7d2e" due to: ' + e);
            }
        }
    },
    "window.check_adblock = true;": {
        uniqueId: "8703d7f8d98d46a5463db89eea32ce11",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["8703d7f8d98d46a5463db89eea32ce11"] !== e) {
                    window.check_adblock = !0;
                    Object.defineProperty(Window.prototype.toString, "8703d7f8d98d46a5463db89eea32ce11", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "8703d7f8d98d46a5463db89eea32ce11" due to: ' + e);
            }
        }
    },
    "window.isAdsDisplayed = true;": {
        uniqueId: "6fdd528c721ed150a4988b0a7c6d81fb",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["6fdd528c721ed150a4988b0a7c6d81fb"] !== e) {
                    window.isAdsDisplayed = !0;
                    Object.defineProperty(Window.prototype.toString, "6fdd528c721ed150a4988b0a7c6d81fb", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "6fdd528c721ed150a4988b0a7c6d81fb" due to: ' + e);
            }
        }
    },
    "window.adBlockDetected = false;": {
        uniqueId: "654b042c99f20d931a52ae0161bc01cd",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["654b042c99f20d931a52ae0161bc01cd"] !== e) {
                    window.adBlockDetected = !1;
                    Object.defineProperty(Window.prototype.toString, "654b042c99f20d931a52ae0161bc01cd", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "654b042c99f20d931a52ae0161bc01cd" due to: ' + e);
            }
        }
    },
    "window.adsEnabled = true;": {
        uniqueId: "62d14321dc3e190666318c2f0ddfdcac",
        func: () => {
            try {
                const d = "done";
                if (Window.prototype.toString["62d14321dc3e190666318c2f0ddfdcac"] !== d) {
                    window.adsEnabled = !0;
                    Object.defineProperty(Window.prototype.toString, "62d14321dc3e190666318c2f0ddfdcac", {
                        value: d,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (d) {
                console.error('Error executing AG js rule with uniqueId "62d14321dc3e190666318c2f0ddfdcac" due to: ' + d);
            }
        }
    },
    "(function(){var b=window.setTimeout;window.setTimeout=function(a,c){if(!/adblock.html/.test(a.toString()))return b(a,c)};})();": {
        uniqueId: "e3fee56c645a7fb47f7a7d03a3a46483",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.e3fee56c645a7fb47f7a7d03a3a46483 !== e) {
                    !function() {
                        var e = window.setTimeout;
                        window.setTimeout = function(t, o) {
                            if (!/adblock.html/.test(t.toString())) return e(t, o);
                        };
                    }();
                    Object.defineProperty(Window.prototype.toString, "e3fee56c645a7fb47f7a7d03a3a46483", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "e3fee56c645a7fb47f7a7d03a3a46483" due to: ' + e);
            }
        }
    },
    "window.uabpdl = window.uabInject = true;": {
        uniqueId: "33d2335f47a6a24e15dbab294084b29d",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["33d2335f47a6a24e15dbab294084b29d"] !== e) {
                    window.uabpdl = window.uabInject = !0;
                    Object.defineProperty(Window.prototype.toString, "33d2335f47a6a24e15dbab294084b29d", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "33d2335f47a6a24e15dbab294084b29d" due to: ' + e);
            }
        }
    },
    'window.ads = "on";': {
        uniqueId: "1667ac15a74b79e35fdab510c44b45c6",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["1667ac15a74b79e35fdab510c44b45c6"] !== e) {
                    window.ads = "on";
                    Object.defineProperty(Window.prototype.toString, "1667ac15a74b79e35fdab510c44b45c6", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "1667ac15a74b79e35fdab510c44b45c6" due to: ' + e);
            }
        }
    },
    "window.detector_active = true;": {
        uniqueId: "fff6b1a1e7573bdc8801939be0d52c55",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.fff6b1a1e7573bdc8801939be0d52c55 !== e) {
                    window.detector_active = !0;
                    Object.defineProperty(Window.prototype.toString, "fff6b1a1e7573bdc8801939be0d52c55", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "fff6b1a1e7573bdc8801939be0d52c55" due to: ' + e);
            }
        }
    },
    "window.adblock = 1;": {
        uniqueId: "1a0341244d89b2f413ccdf78d955eb9b",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["1a0341244d89b2f413ccdf78d955eb9b"] !== e) {
                    window.adblock = 1;
                    Object.defineProperty(Window.prototype.toString, "1a0341244d89b2f413ccdf78d955eb9b", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "1a0341244d89b2f413ccdf78d955eb9b" due to: ' + e);
            }
        }
    },
    'var _st = window.setTimeout; window.setTimeout = function(a, b) { if(!/document\\.querySelector\\("ins\\.adsbygoogle"\\)/.test(a)){ _st(a,b);}};': {
        uniqueId: "7236f7ab988d26aeb65e644c0c708759",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["7236f7ab988d26aeb65e644c0c708759"] !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "7236f7ab988d26aeb65e644c0c708759" due to: ' + e);
            }
        }
    },
    "window.showAds = 1;": {
        uniqueId: "a677ae0f959db896dab64fd632486735",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.a677ae0f959db896dab64fd632486735 !== e) {
                    window.showAds = 1;
                    Object.defineProperty(Window.prototype.toString, "a677ae0f959db896dab64fd632486735", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "a677ae0f959db896dab64fd632486735" due to: ' + e);
            }
        }
    },
    "(function(){var b=window.setTimeout;window.setTimeout=function(a,c){if(!/ad-free subscription/.test(a.toString()))return b(a,c)};})();": {
        uniqueId: "13bb27a7e03ad36f09dfe943af907243",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["13bb27a7e03ad36f09dfe943af907243"] !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "13bb27a7e03ad36f09dfe943af907243" due to: ' + e);
            }
        }
    },
    "window.popns = true;": {
        uniqueId: "d03453914a0f0c39d24075d7778082b7",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.d03453914a0f0c39d24075d7778082b7 !== e) {
                    window.popns = !0;
                    Object.defineProperty(Window.prototype.toString, "d03453914a0f0c39d24075d7778082b7", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "d03453914a0f0c39d24075d7778082b7" due to: ' + e);
            }
        }
    },
    "window.adBlock = false;": {
        uniqueId: "0802a17b43e17e07cd295bcbf572e660",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["0802a17b43e17e07cd295bcbf572e660"] !== e) {
                    window.adBlock = !1;
                    Object.defineProperty(Window.prototype.toString, "0802a17b43e17e07cd295bcbf572e660", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "0802a17b43e17e07cd295bcbf572e660" due to: ' + e);
            }
        }
    },
    "(function(){var b=window.setTimeout;window.setTimeout=function(a,c){if(!/\\!document\\.getElementById[\\s\\S]*?#updato-overlay/.test(a.toString()))return b(a,c)};})();": {
        uniqueId: "c01f2a751b270a3b51a5d5bfcbcb1984",
        func: () => {
            try {
                const t = "done";
                if (Window.prototype.toString.c01f2a751b270a3b51a5d5bfcbcb1984 !== t) {
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
                }
            } catch (t) {
                console.error('Error executing AG js rule with uniqueId "c01f2a751b270a3b51a5d5bfcbcb1984" due to: ' + t);
            }
        }
    },
    "var _st = window.setTimeout; window.setTimeout = function(a, b) { if(!/document\\.getElementById\\('cootent'\\)\\.innerHTML=/.test(a)){ _st(a,b);}};": {
        uniqueId: "d1d17c910459844ab89551639599c825",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.d1d17c910459844ab89551639599c825 !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "d1d17c910459844ab89551639599c825" due to: ' + e);
            }
        }
    },
    "window.areAdsDisplayed = true;": {
        uniqueId: "8e2186350e194ef09a3cc1ab5f463826",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["8e2186350e194ef09a3cc1ab5f463826"] !== e) {
                    window.areAdsDisplayed = !0;
                    Object.defineProperty(Window.prototype.toString, "8e2186350e194ef09a3cc1ab5f463826", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "8e2186350e194ef09a3cc1ab5f463826" due to: ' + e);
            }
        }
    },
    "window.Adv_ab = false;": {
        uniqueId: "5601052c8ba773fc21566b0dfbe3e078",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["5601052c8ba773fc21566b0dfbe3e078"] !== e) {
                    window.Adv_ab = !1;
                    Object.defineProperty(Window.prototype.toString, "5601052c8ba773fc21566b0dfbe3e078", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "5601052c8ba773fc21566b0dfbe3e078" due to: ' + e);
            }
        }
    },
    "var _st = window.setTimeout; window.setTimeout = function(a, b) { if(!/isAdsBlocked/.test(a)){ _st(a,b);}};": {
        uniqueId: "af81ff1359da9b5444bcb191794ca25d",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.af81ff1359da9b5444bcb191794ca25d !== e) {
                    var _st = window.setTimeout;
                    window.setTimeout = function(e, t) {
                        /isAdsBlocked/.test(e) || _st(e, t);
                    };
                    Object.defineProperty(Window.prototype.toString, "af81ff1359da9b5444bcb191794ca25d", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "af81ff1359da9b5444bcb191794ca25d" due to: ' + e);
            }
        }
    },
    "window.adsEnabled=!0;": {
        uniqueId: "be54fb20467f57c75acee13f527620e5",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.be54fb20467f57c75acee13f527620e5 !== e) {
                    window.adsEnabled = !0;
                    Object.defineProperty(Window.prototype.toString, "be54fb20467f57c75acee13f527620e5", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "be54fb20467f57c75acee13f527620e5" due to: ' + e);
            }
        }
    },
    "window.showads=true;": {
        uniqueId: "312c329877d22ebe2fb61034e6a10055",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["312c329877d22ebe2fb61034e6a10055"] !== e) {
                    window.showads = !0;
                    Object.defineProperty(Window.prototype.toString, "312c329877d22ebe2fb61034e6a10055", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "312c329877d22ebe2fb61034e6a10055" due to: ' + e);
            }
        }
    },
    "var _st = window.setTimeout; window.setTimeout = function(a, b) { if(!/_detectAdBlocker/.test(a)){ _st(a,b);}};": {
        uniqueId: "b052dc5df97eaa80a24a214c96f52633",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.b052dc5df97eaa80a24a214c96f52633 !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "b052dc5df97eaa80a24a214c96f52633" due to: ' + e);
            }
        }
    },
    '(function(o,a){o(window,"FTBAds",{get:function(){return a},set:function(b){a=b;o(a,"ads",{value:!1})}})})(Object.defineProperty);': {
        uniqueId: "b04c6d3152fb1fbaf8239ec13936c63f",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.b04c6d3152fb1fbaf8239ec13936c63f !== e) {
                    !function(e, t) {
                        e(window, "FTBAds", {
                            get: function() {
                                return t;
                            },
                            set: function(o) {
                                e(t = o, "ads", {
                                    value: !1
                                });
                            }
                        });
                    }(Object.defineProperty);
                    Object.defineProperty(Window.prototype.toString, "b04c6d3152fb1fbaf8239ec13936c63f", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "b04c6d3152fb1fbaf8239ec13936c63f" due to: ' + e);
            }
        }
    },
    "(function(c,b){Object.defineProperties(window,{dataLayer:c,dataLayer_gtm:c})})({set:function(a){a&&a[0]&&(a[0].AdBlockerDetected=!1);b=a},get:function(){return b},enumerable:!0});": {
        uniqueId: "fe2cdf47d750d5654260bc26dfd9b3f8",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.fe2cdf47d750d5654260bc26dfd9b3f8 !== e) {
                    !function(e) {
                        Object.defineProperties(window, {
                            dataLayer: e,
                            dataLayer_gtm: e
                        });
                    }({
                        set: function(e) {
                            e && e[0] && (e[0].AdBlockerDetected = !1);
                            b = e;
                        },
                        get: function() {
                            return b;
                        },
                        enumerable: !0
                    });
                    Object.defineProperty(Window.prototype.toString, "fe2cdf47d750d5654260bc26dfd9b3f8", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "fe2cdf47d750d5654260bc26dfd9b3f8" due to: ' + e);
            }
        }
    },
    '(function(a){setTimeout=function(){var b="function"==typeof arguments[0]?Function.prototype.toString.call(arguments[0]):"string"==typeof arguments[0]?arguments[0]:String(arguments[0]);return/\\[(_0x[a-z0-9]{4,})\\[\\d+\\]\\][\\[\\(]\\1\\[\\d+\\]/.test(b)?NaN:a.apply(window,arguments)}.bind();Object.defineProperty(setTimeout,"name",{value:a.name});setTimeout.toString=Function.prototype.toString.bind(a)})(setTimeout);': {
        uniqueId: "d51de922f2ef3a82152acd709db8a549",
        func: () => {
            try {
                const t = "done";
                if (Window.prototype.toString.d51de922f2ef3a82152acd709db8a549 !== t) {
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
                }
            } catch (t) {
                console.error('Error executing AG js rule with uniqueId "d51de922f2ef3a82152acd709db8a549" due to: ' + t);
            }
        }
    },
    '(function(b,c){setTimeout=function(){var a=arguments[0];if("function"==typeof a&&/^function [A-Za-z]{1,2}\\(\\)\\s*\\{([A-Za-z])\\|\\|\\(\\1=!0,[\\s\\S]{1,13}\\(\\)\\)\\}$/.test(c.call(a)))throw"Adguard stopped a script execution.";return b.apply(window,arguments)}})(setTimeout,Function.prototype.toString);': {
        uniqueId: "41822b6439a26cd50f44b208e1bad083",
        func: () => {
            try {
                const t = "done";
                if (Window.prototype.toString["41822b6439a26cd50f44b208e1bad083"] !== t) {
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
                }
            } catch (t) {
                console.error('Error executing AG js rule with uniqueId "41822b6439a26cd50f44b208e1bad083" due to: ' + t);
            }
        }
    },
    "window.sessionStorage.loadedAds = 3;": {
        uniqueId: "73f1b4fc791cbf3105708cabf5b1db21",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["73f1b4fc791cbf3105708cabf5b1db21"] !== e) {
                    window.sessionStorage.loadedAds = 3;
                    Object.defineProperty(Window.prototype.toString, "73f1b4fc791cbf3105708cabf5b1db21", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "73f1b4fc791cbf3105708cabf5b1db21" due to: ' + e);
            }
        }
    },
    "window.call_Ad = function() { };": {
        uniqueId: "7c1456a0dab6ca53b945e21a27f6b209",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["7c1456a0dab6ca53b945e21a27f6b209"] !== e) {
                    window.call_Ad = function() {};
                    Object.defineProperty(Window.prototype.toString, "7c1456a0dab6ca53b945e21a27f6b209", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "7c1456a0dab6ca53b945e21a27f6b209" due to: ' + e);
            }
        }
    },
    "window.RunAds = !0;": {
        uniqueId: "6c387c219fbbef62f244b67bd5165f03",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["6c387c219fbbef62f244b67bd5165f03"] !== e) {
                    window.RunAds = !0;
                    Object.defineProperty(Window.prototype.toString, "6c387c219fbbef62f244b67bd5165f03", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "6c387c219fbbef62f244b67bd5165f03" due to: ' + e);
            }
        }
    },
    "window._r3z = {}; Object.defineProperties(window._r3z, { jq: { value: undefined }, pub: { value: {} } });": {
        uniqueId: "48c98c062b9c63813998a881d8c039c9",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["48c98c062b9c63813998a881d8c039c9"] !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "48c98c062b9c63813998a881d8c039c9" due to: ' + e);
            }
        }
    },
    "(function() { window.xRds = false; window.frg = true; window.frag = true;  })();": {
        uniqueId: "baafa2147233f1a8add3836529d4779e",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.baafa2147233f1a8add3836529d4779e !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "baafa2147233f1a8add3836529d4779e" due to: ' + e);
            }
        }
    },
    "window.canABP = true;": {
        uniqueId: "b1d0f666ef36ca7989b62d00b88a8084",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.b1d0f666ef36ca7989b62d00b88a8084 !== e) {
                    window.canABP = !0;
                    Object.defineProperty(Window.prototype.toString, "b1d0f666ef36ca7989b62d00b88a8084", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "b1d0f666ef36ca7989b62d00b88a8084" due to: ' + e);
            }
        }
    },
    "var _st = window.setTimeout; window.setTimeout = function(a, b) { if(!/displayAdBlockedVideo/.test(a)){ _st(a,b);}};": {
        uniqueId: "2ac41d844f1f8bd49b7778aeb6e0c2cc",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["2ac41d844f1f8bd49b7778aeb6e0c2cc"] !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "2ac41d844f1f8bd49b7778aeb6e0c2cc" due to: ' + e);
            }
        }
    },
    "(function(){var b=window.setTimeout;window.setTimeout=function(a,c){if(!/adsbygoogle instanceof Array/.test(a.toString()))return b(a,c)};})();": {
        uniqueId: "db544946f4c7aec68c0cc554e909aa42",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.db544946f4c7aec68c0cc554e909aa42 !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "db544946f4c7aec68c0cc554e909aa42" due to: ' + e);
            }
        }
    },
    'window.ad_permission = "OK";': {
        uniqueId: "7016d2bc404839b07be9953ba599b969",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["7016d2bc404839b07be9953ba599b969"] !== e) {
                    window.ad_permission = "OK";
                    Object.defineProperty(Window.prototype.toString, "7016d2bc404839b07be9953ba599b969", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "7016d2bc404839b07be9953ba599b969" due to: ' + e);
            }
        }
    },
    "(function(){var b=window.setTimeout;window.setTimeout=function(a,c){if(!/new Image\\(\\);s\\.onerror=function/.test(a.toString()))return b(a,c)};})();": {
        uniqueId: "a0c6818afefb34893934c8142a4969ef",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.a0c6818afefb34893934c8142a4969ef !== e) {
                    !function() {
                        var e = window.setTimeout;
                        window.setTimeout = function(t, o) {
                            if (!/new Image\(\);s\.onerror=function/.test(t.toString())) return e(t, o);
                        };
                    }();
                    Object.defineProperty(Window.prototype.toString, "a0c6818afefb34893934c8142a4969ef", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "a0c6818afefb34893934c8142a4969ef" due to: ' + e);
            }
        }
    },
    'document.cookie="popunder=1; path=/;";': {
        uniqueId: "cc60c320cd31f7c797cace7d0a8f787a",
        func: () => {
            try {
                const c = "done";
                if (Window.prototype.toString.cc60c320cd31f7c797cace7d0a8f787a !== c) {
                    document.cookie = "popunder=1; path=/;";
                    Object.defineProperty(Window.prototype.toString, "cc60c320cd31f7c797cace7d0a8f787a", {
                        value: c,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (c) {
                console.error('Error executing AG js rule with uniqueId "cc60c320cd31f7c797cace7d0a8f787a" due to: ' + c);
            }
        }
    },
    "!function(){if(location.pathname.indexOf(\"/iframe/player\")===-1){Object.defineProperty(Object.prototype, 'kununu_mul', { get: function(){ throw null; }, set: function(){ throw null; }});}}();": {
        uniqueId: "0024181b43199be4e6f6d4dc8cace28f",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["0024181b43199be4e6f6d4dc8cace28f"] !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "0024181b43199be4e6f6d4dc8cace28f" due to: ' + e);
            }
        }
    },
    '!function(){const r={apply:(r,o,e)=>(e[0]?.includes?.("{}")&&(e[0]="<?xml version=\\"1.0\\" encoding=\\"UTF-8\\"?>\\n<vmap:VMAP version=\\"1.0\\" xmlns:vmap=\\"http://www.iab.net/videosuite/vmap\\"><vmap:AdBreak timeOffset=\\"start\\" breakType=\\"linear\\" breakId=\\"4f95e542-9da8-480e-8c2a-7ade1ffdcc3d\\"><vmap:AdSource allowMultipleAds=\\"true\\" followRedirects=\\"true\\"><vmap:VASTAdData></vmap:VASTAdData></vmap:AdSource></vmap:AdBreak></vmap:VMAP>"),Reflect.apply(r,o,e))};window.DOMParser.prototype.parseFromString=new Proxy(window.DOMParser.prototype.parseFromString,r)}();': {
        uniqueId: "631aed795dd7ba8bffc8ac13694e2216",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["631aed795dd7ba8bffc8ac13694e2216"] !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "631aed795dd7ba8bffc8ac13694e2216" due to: ' + e);
            }
        }
    },
    '(()=>{window.googletag={apiReady:!0,getVersion:function(){return"202307200101"}};})();': {
        uniqueId: "4f23857baa34d679fafb613b89f85cda",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["4f23857baa34d679fafb613b89f85cda"] !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "4f23857baa34d679fafb613b89f85cda" due to: ' + e);
            }
        }
    },
    '!function(){const e={apply:(e,t,n)=>{if("prg"!==t?.id)return Reflect.apply(e,t,n);const o=Reflect.apply(e,t,n);return Object.defineProperty(o,"top",{value:500}),o}};window.Element.prototype.getBoundingClientRect=new Proxy(window.Element.prototype.getBoundingClientRect,e)}();': {
        uniqueId: "8de36e4bf3b484248c14b692ab7d0b97",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["8de36e4bf3b484248c14b692ab7d0b97"] !== e) {
                    !function() {
                        const e = {
                            apply: (e, t, o) => {
                                if ("prg" !== t?.id) return Reflect.apply(e, t, o);
                                const n = Reflect.apply(e, t, o);
                                return Object.defineProperty(n, "top", {
                                    value: 500
                                }), n;
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "8de36e4bf3b484248c14b692ab7d0b97" due to: ' + e);
            }
        }
    },
    "window.atob = function() { };": {
        uniqueId: "bd6f7fef7248ea934c306654651e8882",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.bd6f7fef7248ea934c306654651e8882 !== e) {
                    window.atob = function() {};
                    Object.defineProperty(Window.prototype.toString, "bd6f7fef7248ea934c306654651e8882", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "bd6f7fef7248ea934c306654651e8882" due to: ' + e);
            }
        }
    },
    "window.canABP = window.canRunAds = window.canCheckAds = true;": {
        uniqueId: "7fa951f734c0ba707fc4893dc83b1a38",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["7fa951f734c0ba707fc4893dc83b1a38"] !== e) {
                    window.canABP = window.canRunAds = window.canCheckAds = !0;
                    Object.defineProperty(Window.prototype.toString, "7fa951f734c0ba707fc4893dc83b1a38", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "7fa951f734c0ba707fc4893dc83b1a38" due to: ' + e);
            }
        }
    },
    "window.canRun = true;": {
        uniqueId: "cb7e5a7f0c3e95af411eb95c880d423d",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.cb7e5a7f0c3e95af411eb95c880d423d !== e) {
                    window.canRun = !0;
                    Object.defineProperty(Window.prototype.toString, "cb7e5a7f0c3e95af411eb95c880d423d", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "cb7e5a7f0c3e95af411eb95c880d423d" due to: ' + e);
            }
        }
    },
    'window.googleToken = "no";': {
        uniqueId: "14f3ab7c380717fd60634b54e8ee9403",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["14f3ab7c380717fd60634b54e8ee9403"] !== e) {
                    window.googleToken = "no";
                    Object.defineProperty(Window.prototype.toString, "14f3ab7c380717fd60634b54e8ee9403", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "14f3ab7c380717fd60634b54e8ee9403" due to: ' + e);
            }
        }
    },
    "window.my_random_number = 1;": {
        uniqueId: "a9f261eb34a000b190c43d2cb371ce6c",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.a9f261eb34a000b190c43d2cb371ce6c !== e) {
                    window.my_random_number = 1;
                    Object.defineProperty(Window.prototype.toString, "a9f261eb34a000b190c43d2cb371ce6c", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "a9f261eb34a000b190c43d2cb371ce6c" due to: ' + e);
            }
        }
    },
    "(function(){var b=window.setTimeout;window.setTimeout=function(a,c){if(!/\\[_0x/.test(a.toString()))return b(a,c)};})();": {
        uniqueId: "ca00780d8510a4940d20b67629664146",
        func: () => {
            try {
                const t = "done";
                if (Window.prototype.toString.ca00780d8510a4940d20b67629664146 !== t) {
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
                }
            } catch (t) {
                console.error('Error executing AG js rule with uniqueId "ca00780d8510a4940d20b67629664146" due to: ' + t);
            }
        }
    },
    "(()=>{window.com_adswizz_synchro_decorateUrl=(a)=>a;})();": {
        uniqueId: "e98a98ef2962b13e300d81c08a1652e0",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.e98a98ef2962b13e300d81c08a1652e0 !== e) {
                    window.com_adswizz_synchro_decorateUrl = e => e;
                    Object.defineProperty(Window.prototype.toString, "e98a98ef2962b13e300d81c08a1652e0", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "e98a98ef2962b13e300d81c08a1652e0" due to: ' + e);
            }
        }
    },
    '(()=>{document.addEventListener(\'DOMContentLoaded\',()=>{var a=document.querySelector("body");document.location.hostname.includes("skmedix.pl")&&a&&a.insertAdjacentHTML("beforeend",\'<ins class="adsbygoogle" data-ad-status="filled"><div id="aswift_" style="position: absolute !important; left: -3000px !important;"><iframe id="aswift_"></iframe></div></ins><iframe src="/aframe"></iframe>\')})})();': {
        uniqueId: "931980a2c6180f6edbcd6f228a2db536",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["931980a2c6180f6edbcd6f228a2db536"] !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "931980a2c6180f6edbcd6f228a2db536" due to: ' + e);
            }
        }
    },
    '(()=>{document.addEventListener("DOMContentLoaded",(()=>{   setTimeout(function() { if(typeof show_game_iframe === "function") { show_game_iframe(); } }, 1000); }));})();': {
        uniqueId: "66e1a81529963f50c62391d4d9356ef0",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["66e1a81529963f50c62391d4d9356ef0"] !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "66e1a81529963f50c62391d4d9356ef0" due to: ' + e);
            }
        }
    },
    '(()=>{window.sas_idmnet=window.sas_idmnet||{};Object.assign(sas_idmnet,{releaseVideo:function(a){if("object"==typeof videoInit&&"function"==typeof videoInit.start)try{videoInit.start(a,n)}catch(a){}},release:function(){},placementsList:function(){}});const a=function(a,b){if(a&&a.push)for(a.push=b;a.length;)b(a.shift())},b=function(a){try{a()}catch(a){console.error(a)}};"complete"===document.readyState?a(sas_idmnet.cmd,b):window.addEventListener("load",()=>{a(sas_idmnet.cmd,b)})})();': {
        uniqueId: "35966fc2cd75edd8c085792a4413cc08",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["35966fc2cd75edd8c085792a4413cc08"] !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "35966fc2cd75edd8c085792a4413cc08" due to: ' + e);
            }
        }
    },
    "!function(){window.YLHH={bidder:{startAuction:function(){}}};}();": {
        uniqueId: "609bede022cc082da833f6d8f49bff77",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["609bede022cc082da833f6d8f49bff77"] !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "609bede022cc082da833f6d8f49bff77" due to: ' + e);
            }
        }
    },
    "(function(){var c=window.setTimeout;window.setTimeout=function(f,g){return g===1e3&&/#kam-ban-player/.test(f.toString())&&(g*=0.01),c.apply(this,arguments)}.bind(window)})();": {
        uniqueId: "4706a9dfd57dc72a9584b54986a27381",
        func: () => {
            try {
                const t = "done";
                if (Window.prototype.toString["4706a9dfd57dc72a9584b54986a27381"] !== t) {
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
                }
            } catch (t) {
                console.error('Error executing AG js rule with uniqueId "4706a9dfd57dc72a9584b54986a27381" due to: ' + t);
            }
        }
    },
    '(()=>{const t=Object.getOwnPropertyDescriptor,e={apply:(e,n,r)=>{const o=r[0];if(o?.toString?.()?.includes("EventTarget")){const e=t(o,"addEventListener");e?.set?.toString&&(e.set.toString=function(){}),e?.get?.toString&&(e.get.toString=function(){})}return Reflect.apply(e,n,r)}};window.Object.getOwnPropertyDescriptors=new Proxy(window.Object.getOwnPropertyDescriptors,e)})();': {
        uniqueId: "f5e04b1e897644b8741f5724e8210233",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.f5e04b1e897644b8741f5724e8210233 !== e) {
                    (() => {
                        const e = Object.getOwnPropertyDescriptor, t = {
                            apply: (t, r, o) => {
                                const n = o[0];
                                if (n?.toString?.()?.includes("EventTarget")) {
                                    const t = e(n, "addEventListener");
                                    t?.set?.toString && (t.set.toString = function() {}), t?.get?.toString && (t.get.toString = function() {});
                                }
                                return Reflect.apply(t, r, o);
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "f5e04b1e897644b8741f5724e8210233" due to: ' + e);
            }
        }
    },
    '(()=>{Object.defineProperty=new Proxy(Object.defineProperty,{apply:(e,t,n)=>{const r=new Set(["VP","w3","JW"]),o=n[1],c=n[2]?.get;return o&&r.has(o)&&"function"==typeof c&&c.toString().includes("()=>i")&&(n[2].get=function(){return function(){return!1}}),Reflect.apply(e,t,n)}});})();': {
        uniqueId: "d2e0c1a15c46cd17c61c4bb3e9ed07ff",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.d2e0c1a15c46cd17c61c4bb3e9ed07ff !== e) {
                    Object.defineProperty = new Proxy(Object.defineProperty, {
                        apply: (e, t, c) => {
                            const r = new Set([ "VP", "w3", "JW" ]), n = c[1], o = c[2]?.get;
                            return n && r.has(n) && "function" == typeof o && o.toString().includes("()=>i") && (c[2].get = function() {
                                return function() {
                                    return !1;
                                };
                            }), Reflect.apply(e, t, c);
                        }
                    });
                    Object.defineProperty(Window.prototype.toString, "d2e0c1a15c46cd17c61c4bb3e9ed07ff", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "d2e0c1a15c46cd17c61c4bb3e9ed07ff" due to: ' + e);
            }
        }
    },
    "window.showAds = true;": {
        uniqueId: "8174026a0a9d6a02df2f05c27e91b2e6",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["8174026a0a9d6a02df2f05c27e91b2e6"] !== e) {
                    window.showAds = !0;
                    Object.defineProperty(Window.prototype.toString, "8174026a0a9d6a02df2f05c27e91b2e6", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "8174026a0a9d6a02df2f05c27e91b2e6" due to: ' + e);
            }
        }
    },
    "window.uabpInject = function() {};": {
        uniqueId: "2809f16b065b7f9160467af78eee1331",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["2809f16b065b7f9160467af78eee1331"] !== e) {
                    window.uabpInject = function() {};
                    Object.defineProperty(Window.prototype.toString, "2809f16b065b7f9160467af78eee1331", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "2809f16b065b7f9160467af78eee1331" due to: ' + e);
            }
        }
    },
    "(function(){var b=window.setTimeout;window.setTimeout=function(a,c){if(!/checkAds\\(\\);/.test(a.toString()))return b(a,c)};})();": {
        uniqueId: "140cb9c461f230aead2587075c4c3389",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["140cb9c461f230aead2587075c4c3389"] !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "140cb9c461f230aead2587075c4c3389" due to: ' + e);
            }
        }
    },
    "window.adblock = true;": {
        uniqueId: "a512aca8faf6bfd74f571200978abea9",
        func: () => {
            try {
                const a = "done";
                if (Window.prototype.toString.a512aca8faf6bfd74f571200978abea9 !== a) {
                    window.adblock = !0;
                    Object.defineProperty(Window.prototype.toString, "a512aca8faf6bfd74f571200978abea9", {
                        value: a,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (a) {
                console.error('Error executing AG js rule with uniqueId "a512aca8faf6bfd74f571200978abea9" due to: ' + a);
            }
        }
    },
    "window.ads_unblocked = true;": {
        uniqueId: "786bc16fd657931f3a0d027130de4773",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["786bc16fd657931f3a0d027130de4773"] !== e) {
                    window.ads_unblocked = !0;
                    Object.defineProperty(Window.prototype.toString, "786bc16fd657931f3a0d027130de4773", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "786bc16fd657931f3a0d027130de4773" due to: ' + e);
            }
        }
    },
    '!function(){const r={apply:(r,o,e)=>(e[0]?.includes?.("</VAST>")&&(e[0]=""),Reflect.apply(r,o,e))};window.DOMParser.prototype.parseFromString=new Proxy(window.DOMParser.prototype.parseFromString,r)}();': {
        uniqueId: "877dd0aed94e4d29a83c4c3327d544f8",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["877dd0aed94e4d29a83c4c3327d544f8"] !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "877dd0aed94e4d29a83c4c3327d544f8" due to: ' + e);
            }
        }
    },
    "window.adsOk = !0;": {
        uniqueId: "58f079e742093da39c91a591e99389ce",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["58f079e742093da39c91a591e99389ce"] !== e) {
                    window.adsOk = !0;
                    Object.defineProperty(Window.prototype.toString, "58f079e742093da39c91a591e99389ce", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "58f079e742093da39c91a591e99389ce" due to: ' + e);
            }
        }
    },
    "window.ads_ok = true;": {
        uniqueId: "6038ece558032e1fa11a8e02beb32499",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["6038ece558032e1fa11a8e02beb32499"] !== e) {
                    window.ads_ok = !0;
                    Object.defineProperty(Window.prototype.toString, "6038ece558032e1fa11a8e02beb32499", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "6038ece558032e1fa11a8e02beb32499" due to: ' + e);
            }
        }
    },
    '(()=>{const t={construct:(t,n,o)=>{const e=n[0],s=e?.toString(),c=s?.includes("await this.whenGDPRClosed()");return c&&(n[0]=t=>t(!0)),Reflect.construct(t,n,o)}};window.Promise=new Proxy(window.Promise,t)})();': {
        uniqueId: "2def40885e045b3521a04fe19856fe24",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["2def40885e045b3521a04fe19856fe24"] !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "2def40885e045b3521a04fe19856fe24" due to: ' + e);
            }
        }
    },
    "(function(){var b=window.setTimeout;window.setTimeout=function(a,c){if(!/notDetectedBy/.test(a.toString()))return b(a,c)};})();": {
        uniqueId: "2eed1ef0d478b67cb9b988fd355d6582",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["2eed1ef0d478b67cb9b988fd355d6582"] !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "2eed1ef0d478b67cb9b988fd355d6582" due to: ' + e);
            }
        }
    },
    "window.adBlockTest = true;": {
        uniqueId: "ea236b492fa35d17f8aeddec6c38ef4a",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.ea236b492fa35d17f8aeddec6c38ef4a !== e) {
                    window.adBlockTest = !0;
                    Object.defineProperty(Window.prototype.toString, "ea236b492fa35d17f8aeddec6c38ef4a", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "ea236b492fa35d17f8aeddec6c38ef4a" due to: ' + e);
            }
        }
    },
    '(function(){var b=XMLHttpRequest.prototype.open,c=/ib\\.adnxs\\.com/i;XMLHttpRequest.prototype.open=function(d,a){if("POST"===d&&c.test(a))this.send=function(){return null},this.setRequestHeader=function(){return null},console.log("AG has blocked request: ",a);else return b.apply(this,arguments)}})();': {
        uniqueId: "14b2658c5d58ff999b0f841402be6327",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["14b2658c5d58ff999b0f841402be6327"] !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "14b2658c5d58ff999b0f841402be6327" due to: ' + e);
            }
        }
    },
    '!function(){if(location.pathname.includes("/source/playerads")){var b=new MutationObserver(function(){var a=document.querySelector(\'script[type="text/javascript"]\');a&&a.textContent.includes(\'"ads": [\')&&(b.disconnect(),a.textContent=a.textContent.replace(/("ads": \\[\\{)[\\s\\S]*?(\\}\\])/,"$1$2"))});b.observe(document,{childList:!0,subtree:!0})}}();': {
        uniqueId: "aae0d51166190a469962b4394ad11852",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.aae0d51166190a469962b4394ad11852 !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "aae0d51166190a469962b4394ad11852" due to: ' + e);
            }
        }
    },
    "clientSide.player.play(true);": {
        uniqueId: "a5b3c4cf6ebf6b65e649d4696be29d38",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.a5b3c4cf6ebf6b65e649d4696be29d38 !== e) {
                    clientSide.player.play(!0);
                    Object.defineProperty(Window.prototype.toString, "a5b3c4cf6ebf6b65e649d4696be29d38", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "a5b3c4cf6ebf6b65e649d4696be29d38" due to: ' + e);
            }
        }
    },
    '(()=>{if(location.href.includes("/embed/?link=")){const i=new URL(location.href).searchParams.get("link");if(i)try{location.assign(i)}catch(i){}}})();': {
        uniqueId: "70f2ca47c305ca62ef161409642baaae",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["70f2ca47c305ca62ef161409642baaae"] !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "70f2ca47c305ca62ef161409642baaae" due to: ' + e);
            }
        }
    },
    "(function(){Object.defineProperty(window, 'ExoLoader', { get: function() { return; } }); var c=document.addEventListener;document.addEventListener=function(a,b,d,e){\"getexoloader\"!=a&&-1==b.toString().indexOf('loader')&&c(a,b,d,e)}.bind(document);})();": {
        uniqueId: "a8d7f5b4e27b5a94d3b0c3528bdccb9c",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.a8d7f5b4e27b5a94d3b0c3528bdccb9c !== e) {
                    !function() {
                        Object.defineProperty(window, "ExoLoader", {
                            get: function() {}
                        });
                        var e = document.addEventListener;
                        document.addEventListener = function(t, o, n, d) {
                            "getexoloader" != t && -1 == o.toString().indexOf("loader") && e(t, o, n, d);
                        }.bind(document);
                    }();
                    Object.defineProperty(Window.prototype.toString, "a8d7f5b4e27b5a94d3b0c3528bdccb9c", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "a8d7f5b4e27b5a94d3b0c3528bdccb9c" due to: ' + e);
            }
        }
    },
    '(()=>{if(window.self!==window.top)try{if("object"==typeof localStorage)return}catch(a){delete window.localStorage,window.localStorage={setItem(){},getItem(){},removeItem(){},clear(){}}}})();': {
        uniqueId: "6c5874d9ea24235e4a8490028ce09e66",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["6c5874d9ea24235e4a8490028ce09e66"] !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "6c5874d9ea24235e4a8490028ce09e66" due to: ' + e);
            }
        }
    },
    "(()=>{const n=[];n.push=n=>{try{n()}catch(n){console.error(n)}},window.adsNinja=window.adsNinja||{queue:n}})();": {
        uniqueId: "4893d02be5a2a7c0f59287a47260c7b0",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["4893d02be5a2a7c0f59287a47260c7b0"] !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "4893d02be5a2a7c0f59287a47260c7b0" due to: ' + e);
            }
        }
    },
    '(()=>{window.Bolt={on:(o,n,i)=>{"precontent_ad_video"===o&&"AD_COMPLETE"===n&&"function"==typeof i&&i()},BOLT_AD_COMPLETE:"AD_COMPLETE",BOLT_AD_ERROR:"AD_ERROR"},window.ramp=window.ramp||{},window.ramp.addUnits=()=>Promise.resolve(),window.ramp.displayUnits=()=>{setTimeout((()=>{"function"==typeof window.ramp.onPlayerReady&&window.ramp.onPlayerReady()}),1)};})();': {
        uniqueId: "13196ca8ba80be48cb3a530394beced8",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["13196ca8ba80be48cb3a530394beced8"] !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "13196ca8ba80be48cb3a530394beced8" due to: ' + e);
            }
        }
    },
    '(()=>{const e={apply:(e,t,o)=>(o[0]=!0,Reflect.apply(e,t,o))};let t,o=!1;Object.defineProperty(window,"ig",{get:function(){return"function"!=typeof t?.RetentionRewardedVideo?.prototype?.rewardedVideoResult||o||(t.RetentionRewardedVideo.prototype.rewardedVideoResult=new Proxy(t.RetentionRewardedVideo.prototype.rewardedVideoResult,e),o=!0),t},set:function(e){t=e}})})();': {
        uniqueId: "49064caba0f35708edea647b43d9260f",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["49064caba0f35708edea647b43d9260f"] !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "49064caba0f35708edea647b43d9260f" due to: ' + e);
            }
        }
    },
    '(()=>{let e,n=!1;const t=function(){};Object.defineProperty(window,"videojs",{get:function(){return e},set:function(o){e=o,!n&&e&&"function"==typeof e.registerPlugin&&(n=!0,e.registerPlugin("skipIma3Unskippable",t))}}),window.SlotTypeEnum={},window.ANAWeb=function(){},window.ANAWeb.prototype.createVideoSlot=function(){},window.ANAWeb.prototype.createSlot=function(){},window.ANAWeb.VideoPlayerType={},window.addEventListener("load",(function(){document.dispatchEvent(new CustomEvent("ANAReady"))}))})();': {
        uniqueId: "eb66815e102df8eab52a54543edf987e",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.eb66815e102df8eab52a54543edf987e !== e) {
                    (() => {
                        let e, t = !1;
                        const n = function() {};
                        Object.defineProperty(window, "videojs", {
                            get: function() {
                                return e;
                            },
                            set: function(o) {
                                e = o, !t && e && "function" == typeof e.registerPlugin && (t = !0, e.registerPlugin("skipIma3Unskippable", n));
                            }
                        }), window.SlotTypeEnum = {}, window.ANAWeb = function() {}, window.ANAWeb.prototype.createVideoSlot = function() {}, 
                        window.ANAWeb.prototype.createSlot = function() {}, window.ANAWeb.VideoPlayerType = {}, 
                        window.addEventListener("load", (function() {
                            document.dispatchEvent(new CustomEvent("ANAReady"));
                        }));
                    })();
                    Object.defineProperty(Window.prototype.toString, "eb66815e102df8eab52a54543edf987e", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "eb66815e102df8eab52a54543edf987e" due to: ' + e);
            }
        }
    },
    '(()=>{const a=function(){};window.apstag={fetchBids(c,a){"function"==typeof a&&a([])},init:a,setDisplayBids:a,targetingKeys:a}})();': {
        uniqueId: "11a07f3c1f878acc052df77d287cc2cb",
        func: () => {
            try {
                const c = "done";
                if (Window.prototype.toString["11a07f3c1f878acc052df77d287cc2cb"] !== c) {
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
                }
            } catch (c) {
                console.error('Error executing AG js rule with uniqueId "11a07f3c1f878acc052df77d287cc2cb" due to: ' + c);
            }
        }
    },
    '(()=>{window.JSON.parse=new Proxy(JSON.parse,{apply(r,e,t){const s=Reflect.apply(r,e,t),l=s?.results;try{if(l&&Array.isArray(l))s?.results&&(s.results=s.results.filter((r=>{if(!Object.prototype.hasOwnProperty.call(r,"adTitle"))return r})));else for(let r in s){const e=s[r]?.results;e&&Array.isArray(e)&&(s[r].results=s[r].results.filter((r=>{if(!Object.prototype.hasOwnProperty.call(r,"adTitle"))return r})))}}catch(r){}return s}});})();': {
        uniqueId: "b91767671ee5e3e933cdcfdac4efc25b",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.b91767671ee5e3e933cdcfdac4efc25b !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "b91767671ee5e3e933cdcfdac4efc25b" due to: ' + e);
            }
        }
    },
    '(()=>{const n=function(n){if("function"==typeof n)try{n.call()}catch(n){}},i={addAdUnits:function(){},adServers:{dfp:{buildVideoUrl:function(){return""}}},adUnits:[],aliasBidder:function(){},cmd:[],enableAnalytics:function(){},getHighestCpmBids:function(){return[]},libLoaded:!0,que:[],requestBids:function(n){if(n instanceof Object&&n.bidsBackHandler)try{n.bidsBackHandler.call()}catch(n){}},removeAdUnit:function(){},setBidderConfig:function(){},setConfig:function(){},setTargetingForGPTAsync:function(){},rp:{requestVideoBids:function(n){if("function"==typeof n?.callback)try{n.callback.call()}catch(n){}}}};i.cmd.push=n,i.que.push=n,window.pbjs=i})();': {
        uniqueId: "a12991f34fbcdc0cb606380a258fde90",
        func: () => {
            try {
                const n = "done";
                if (Window.prototype.toString.a12991f34fbcdc0cb606380a258fde90 !== n) {
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
                }
            } catch (n) {
                console.error('Error executing AG js rule with uniqueId "a12991f34fbcdc0cb606380a258fde90" due to: ' + n);
            }
        }
    },
    '(()=>{const c=function(){[...arguments].forEach((c=>{if("function"==typeof c)try{c(!0)}catch(c){console.debug(c)}}))},n=[];n.push=c,window.PQ={cmd:n,getTargeting:c}})();': {
        uniqueId: "52a467e415654146fde7899c49035b7f",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["52a467e415654146fde7899c49035b7f"] !== e) {
                    (() => {
                        const e = function() {
                            [ ...arguments ].forEach((e => {
                                if ("function" == typeof e) try {
                                    e(!0);
                                } catch (e) {
                                    console.debug(e);
                                }
                            }));
                        }, o = [];
                        o.push = e, window.PQ = {
                            cmd: o,
                            getTargeting: e
                        };
                    })();
                    Object.defineProperty(Window.prototype.toString, "52a467e415654146fde7899c49035b7f", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "52a467e415654146fde7899c49035b7f" due to: ' + e);
            }
        }
    },
    '(()=>{const n=function(n){if("function"==typeof n)try{n.call()}catch(n){}},i={addAdUnits:function(){},adServers:{dfp:{buildVideoUrl:function(){return""}}},adUnits:[],aliasBidder:function(){},cmd:[],enableAnalytics:function(){},getHighestCpmBids:function(){return[]},libLoaded:!0,que:[],requestBids:function(n){if(n instanceof Object&&n.bidsBackHandler)try{n.bidsBackHandler.call()}catch(n){}},removeAdUnit:function(){},setBidderConfig:function(){},setConfig:function(){},setTargetingForGPTAsync:function(){}};i.cmd.push=n,i.que.push=n,window.pbjs=i})();': {
        uniqueId: "5eccf85ec7e71ba4deefe939741fb145",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["5eccf85ec7e71ba4deefe939741fb145"] !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "5eccf85ec7e71ba4deefe939741fb145" due to: ' + e);
            }
        }
    },
    '(()=>{const t=[];t.push=function(t){try{t()}catch(t){}};window.headertag={cmd:t,buildGamMvt:function(t,c){const n={[c]:"https://securepubads.g.doubleclick.net/gampad/ads"};return n||{}},retrieveVideoDemand:function(t,c,n){const e=t[0]?.htSlotName;if("function"==typeof c)try{c(e)}catch(t){}}}})();': {
        uniqueId: "4a7e38f499848781627483fb1bb70105",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["4a7e38f499848781627483fb1bb70105"] !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "4a7e38f499848781627483fb1bb70105" due to: ' + e);
            }
        }
    },
    '(()=>{const e="3.453.0",t=function(){},s={},n=function(e){const t=document.createElement("div");t.style.setProperty("display","none","important"),t.style.setProperty("visibility","collapse","important"),e&&e.appendChild(t)};n.prototype.destroy=t,n.prototype.initialize=t;const i=function(){};i.CompanionBackfillMode={ALWAYS:"always",ON_MASTER_AD:"on_master_ad"},i.VpaidMode={DISABLED:0,ENABLED:1,INSECURE:2},i.prototype={c:!0,f:{},i:!1,l:"",p:"",r:0,t:"",v:"",getCompanionBackfill:t,getDisableCustomPlaybackForIOS10Plus(){return this.i},getDisabledFlashAds:()=>!0,getFeatureFlags(){return this.f},getLocale(){return this.l},getNumRedirects(){return this.r},getPlayerType(){return this.t},getPlayerVersion(){return this.v},getPpid(){return this.p},getVpaidMode(){return this.C},isCookiesEnabled(){return this.c},isVpaidAdapter(){return this.M},setCompanionBackfill:t,setAutoPlayAdBreaks(e){this.K=e},setCookiesEnabled(e){this.c=!!e},setDisableCustomPlaybackForIOS10Plus(e){this.i=!!e},setDisableFlashAds:t,setFeatureFlags(e){this.f=!!e},setIsVpaidAdapter(e){this.M=e},setLocale(e){this.l=!!e},setNumRedirects(e){this.r=!!e},setPageCorrelator(e){this.R=e},setPlayerType(e){this.t=!!e},setPlayerVersion(e){this.v=!!e},setPpid(e){this.p=!!e},setVpaidMode(e){this.C=e},setSessionId:t,setStreamCorrelator:t,setVpaidAllowed:t,CompanionBackfillMode:{ALWAYS:"always",ON_MASTER_AD:"on_master_ad"},VpaidMode:{DISABLED:0,ENABLED:1,INSECURE:2}};const r=function(){this.listeners=new Map,this._dispatch=function(e){let t=this.listeners.get(e.type);t=t?t.values():[];for(const s of Array.from(t))try{s(e)}catch(e){console.trace(e)}},this.addEventListener=function(e,t,s,n){Array.isArray(e)||(e=[e]);for(let s=0;s<e.length;s+=1){const i=e[s];this.listeners.has(i)||this.listeners.set(i,new Map),this.listeners.get(i).set(t,t.bind(n||this))}},this.removeEventListener=function(e,t){Array.isArray(e)||(e=[e]);for(let s=0;s<e.length;s+=1){const n=e[s];this.listeners.get(n)?.delete(t)}}},o=new r;o.volume=1,o.collapse=t,o.configureAdsManager=t,o.destroy=t,o.discardAdBreak=t,o.expand=t,o.focus=t,o.getAdSkippableState=()=>!1,o.getCuePoints=()=>[0],o.getCurrentAd=()=>h,o.getCurrentAdCuePoints=()=>[],o.getRemainingTime=()=>0,o.getVolume=function(){return this.volume},o.init=t,o.isCustomClickTrackingUsed=()=>!1,o.isCustomPlaybackUsed=()=>!1,o.pause=t,o.requestNextAdBreak=t,o.resize=t,o.resume=t,o.setVolume=function(e){this.volume=e},o.skip=t,o.start=function(){for(const e of [T.Type.LOADED,T.Type.STARTED,T.Type.CONTENT_RESUME_REQUESTED,T.Type.AD_BUFFERING,T.Type.FIRST_QUARTILE,T.Type.MIDPOINT,T.Type.THIRD_QUARTILE,T.Type.COMPLETE,T.Type.ALL_ADS_COMPLETED])try{this._dispatch(new s.AdEvent(e))}catch(e){console.trace(e)}},o.stop=t,o.updateAdsRenderingSettings=t;const a=Object.create(o),d=function(e,t,s){this.type=e,this.adsRequest=t,this.userRequestContext=s};d.prototype={getAdsManager:()=>a,getUserRequestContext(){return this.userRequestContext?this.userRequestContext:{}}},d.Type={ADS_MANAGER_LOADED:"adsManagerLoaded"};const E=r;E.prototype.settings=new i,E.prototype.contentComplete=t,E.prototype.destroy=t,E.prototype.getSettings=function(){return this.settings},E.prototype.getVersion=()=>e,E.prototype.requestAds=function(e,t){requestAnimationFrame((()=>{const{ADS_MANAGER_LOADED:n}=d.Type,i=new s.AdsManagerLoadedEvent(n,e,t);this._dispatch(i)}));const n=new s.AdError("adPlayError",1205,1205,"The browser prevented playback initiated without user interaction.",e,t);requestAnimationFrame((()=>{this._dispatch(new s.AdErrorEvent(n))}))};const A=t,u=function(){};u.prototype={setAdWillAutoPlay:t,setAdWillPlayMuted:t,setContinuousPlayback:t};const l=function(){};l.prototype={getAdPosition:()=>1,getIsBumper:()=>!1,getMaxDuration:()=>-1,getPodIndex:()=>1,getTimeOffset:()=>0,getTotalAds:()=>1};const g=function(){};g.prototype.getAdIdRegistry=function(){return""},g.prototype.getAdIsValue=function(){return""};const p=function(){};p.prototype={pi:new l,getAdId:()=>"",getAdPodInfo(){return this.pi},getAdSystem:()=>"",getAdvertiserName:()=>"",getApiFramework:()=>null,getCompanionAds:()=>[],getContentType:()=>"",getCreativeAdId:()=>"",getDealId:()=>"",getDescription:()=>"",getDuration:()=>8.5,getHeight:()=>0,getMediaUrl:()=>null,getMinSuggestedDuration:()=>-2,getSkipTimeOffset:()=>-1,getSurveyUrl:()=>null,getTitle:()=>"",getTraffickingParametersString:()=>"",getUiElements:()=>[""],getUniversalAdIdRegistry:()=>"unknown",getUniversalAdIds:()=>[new g],getUniversalAdIdValue:()=>"unknown",getVastMediaBitrate:()=>0,getVastMediaHeight:()=>0,getVastMediaWidth:()=>0,getWidth:()=>0,getWrapperAdIds:()=>[""],getWrapperAdSystems:()=>[""],getWrapperCreativeIds:()=>[""],isLinear:()=>!0,isSkippable:()=>!0};const c=function(){};c.prototype={getAdSlotId:()=>"",getContent:()=>"",getContentType:()=>"",getHeight:()=>1,getWidth:()=>1};const C=function(e,t,s,n,i,r){this.errorCode=t,this.message=n,this.type=e,this.adsRequest=i,this.userRequestContext=r,this.getErrorCode=function(){return this.errorCode},this.getInnerError=function(){return null},this.getMessage=function(){return this.message},this.getType=function(){return this.type},this.getVastErrorCode=function(){return this.vastErrorCode},this.toString=function(){return`AdError ${this.errorCode}: ${this.message}`}};C.ErrorCode={},C.Type={};const h=(()=>{try{for(const e of Object.values(window.vidible._getContexts()))if(e.getPlayer()?.div?.innerHTML.includes("www.engadget.com"))return!0}catch(e){}return!1})()?void 0:new p,T=function(e){this.type=e};T.prototype={getAd:()=>h,getAdData:()=>{}},T.Type={AD_BREAK_READY:"adBreakReady",AD_BUFFERING:"adBuffering",AD_CAN_PLAY:"adCanPlay",AD_METADATA:"adMetadata",AD_PROGRESS:"adProgress",ALL_ADS_COMPLETED:"allAdsCompleted",CLICK:"click",COMPLETE:"complete",CONTENT_PAUSE_REQUESTED:"contentPauseRequested",CONTENT_RESUME_REQUESTED:"contentResumeRequested",DURATION_CHANGE:"durationChange",EXPANDED_CHANGED:"expandedChanged",FIRST_QUARTILE:"firstQuartile",IMPRESSION:"impression",INTERACTION:"interaction",LINEAR_CHANGE:"linearChange",LINEAR_CHANGED:"linearChanged",LOADED:"loaded",LOG:"log",MIDPOINT:"midpoint",PAUSED:"pause",RESUMED:"resume",SKIPPABLE_STATE_CHANGED:"skippableStateChanged",SKIPPED:"skip",STARTED:"start",THIRD_QUARTILE:"thirdQuartile",USER_CLOSE:"userClose",VIDEO_CLICKED:"videoClicked",VIDEO_ICON_CLICKED:"videoIconClicked",VIEWABLE_IMPRESSION:"viewable_impression",VOLUME_CHANGED:"volumeChange",VOLUME_MUTED:"mute"};const y=function(e){this.error=e,this.type="adError",this.getError=function(){return this.error},this.getUserRequestContext=function(){return this.error?.userRequestContext?this.error.userRequestContext:{}}};y.Type={AD_ERROR:"adError"};const I=function(){};I.Type={CUSTOM_CONTENT_LOADED:"deprecated-event"};const R=function(){};R.CreativeType={ALL:"All",FLASH:"Flash",IMAGE:"Image"},R.ResourceType={ALL:"All",HTML:"Html",IFRAME:"IFrame",STATIC:"Static"},R.SizeCriteria={IGNORE:"IgnoreSize",SELECT_EXACT_MATCH:"SelectExactMatch",SELECT_NEAR_MATCH:"SelectNearMatch"};const S=function(){};S.prototype={getCuePoints:()=>[],getAdIdRegistry:()=>"",getAdIdValue:()=>""};const D=t;Object.assign(s,{AdCuePoints:S,AdDisplayContainer:n,AdError:C,AdErrorEvent:y,AdEvent:T,AdPodInfo:l,AdProgressData:D,AdsLoader:E,AdsManager:a,AdsManagerLoadedEvent:d,AdsRenderingSettings:A,AdsRequest:u,CompanionAd:c,CompanionAdSelectionSettings:R,CustomContentLoadedEvent:I,gptProxyInstance:{},ImaSdkSettings:i,OmidAccessMode:{DOMAIN:"domain",FULL:"full",LIMITED:"limited"},OmidVerificationVendor:{1:"OTHER",2:"MOAT",3:"DOUBLEVERIFY",4:"INTEGRAL_AD_SCIENCE",5:"PIXELATE",6:"NIELSEN",7:"COMSCORE",8:"MEETRICS",9:"GOOGLE",OTHER:1,MOAT:2,DOUBLEVERIFY:3,INTEGRAL_AD_SCIENCE:4,PIXELATE:5,NIELSEN:6,COMSCORE:7,MEETRICS:8,GOOGLE:9},settings:new i,UiElements:{AD_ATTRIBUTION:"adAttribution",COUNTDOWN:"countdown"},UniversalAdIdInfo:g,VERSION:e,ViewMode:{FULLSCREEN:"fullscreen",NORMAL:"normal"}}),window.google||(window.google={}),window.google.ima?.dai&&(s.dai=window.google.ima.dai),window.google.ima=s})();': {
        uniqueId: "d7a710ada6cca5832af6d92e62726e74",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.d7a710ada6cca5832af6d92e62726e74 !== e) {
                    (() => {
                        const e = "3.453.0", t = function() {}, n = {}, i = function(e) {
                            const t = document.createElement("div");
                            t.style.setProperty("display", "none", "important"), t.style.setProperty("visibility", "collapse", "important"), 
                            e && e.appendChild(t);
                        };
                        i.prototype.destroy = t, i.prototype.initialize = t;
                        const r = function() {};
                        r.CompanionBackfillMode = {
                            ALWAYS: "always",
                            ON_MASTER_AD: "on_master_ad"
                        }, r.VpaidMode = {
                            DISABLED: 0,
                            ENABLED: 1,
                            INSECURE: 2
                        }, r.prototype = {
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
                            }, this.addEventListener = function(e, t, n, i) {
                                Array.isArray(e) || (e = [ e ]);
                                for (let n = 0; n < e.length; n += 1) {
                                    const r = e[n];
                                    this.listeners.has(r) || this.listeners.set(r, new Map), this.listeners.get(r).set(t, t.bind(i || this));
                                }
                            }, this.removeEventListener = function(e, t) {
                                Array.isArray(e) || (e = [ e ]);
                                for (let n = 0; n < e.length; n += 1) {
                                    const i = e[n];
                                    this.listeners.get(i)?.delete(t);
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
                        u.prototype.settings = new r, u.prototype.contentComplete = t, u.prototype.destroy = t, 
                        u.prototype.getSettings = function() {
                            return this.settings;
                        }, u.prototype.getVersion = () => e, u.prototype.requestAds = function(e, t) {
                            requestAnimationFrame((() => {
                                const {ADS_MANAGER_LOADED: i} = d.Type, r = new n.AdsManagerLoadedEvent(i, e, t);
                                this._dispatch(r);
                            }));
                            const i = new n.AdError("adPlayError", 1205, 1205, "The browser prevented playback initiated without user interaction.", e, t);
                            requestAnimationFrame((() => {
                                this._dispatch(new n.AdErrorEvent(i));
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
                        const C = function(e, t, n, i, r, s) {
                            this.errorCode = t, this.message = i, this.type = e, this.adsRequest = r, this.userRequestContext = s, 
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
                            AdDisplayContainer: i,
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
                            ImaSdkSettings: r,
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
                            settings: new r,
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "d7a710ada6cca5832af6d92e62726e74" due to: ' + e);
            }
        }
    },
    '(()=>{const t=[];t.push=function(t){"object"==typeof t&&t.events&&Object.values(t.events).forEach((t=>{if("function"==typeof t)try{t()}catch(t){}}))},window.AdBridg={cmd:t}})();': {
        uniqueId: "f6311be2c1ed023feeb00c3d41dea489",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.f6311be2c1ed023feeb00c3d41dea489 !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "f6311be2c1ed023feeb00c3d41dea489" due to: ' + e);
            }
        }
    },
    '(()=>{let t=window?.__iasPET?.queue;Array.isArray(t)||(t=[]);const s=JSON.stringify({brandSafety:{},slots:{}});function e(t){try{t?.dataHandler?.(s)}catch(t){}}for(t.push=e,window.__iasPET={VERSION:"1.16.18",queue:t,sessionId:"",setTargetingForAppNexus(){},setTargetingForGPT(){},start(){}};t.length;)e(t.shift())})();': {
        uniqueId: "baf394a72c20f8e6c3a0adc04c9df104",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.baf394a72c20f8e6c3a0adc04c9df104 !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "baf394a72c20f8e6c3a0adc04c9df104" due to: ' + e);
            }
        }
    },
    '(()=>{const a=location.href;if(!a.includes("/download?link="))return;const b=new URL(a),c=b.searchParams.get("link");try{location.assign(`${location.protocol}//${c}`)}catch(a){}})();': {
        uniqueId: "38006b4fe319b5bb0c1badc09b30380c",
        func: () => {
            try {
                const o = "done";
                if (Window.prototype.toString["38006b4fe319b5bb0c1badc09b30380c"] !== o) {
                    (() => {
                        const o = location.href;
                        if (!o.includes("/download?link=")) return;
                        const e = new URL(o).searchParams.get("link");
                        try {
                            location.assign(`${location.protocol}//${e}`);
                        } catch (o) {}
                    })();
                    Object.defineProperty(Window.prototype.toString, "38006b4fe319b5bb0c1badc09b30380c", {
                        value: o,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (o) {
                console.error('Error executing AG js rule with uniqueId "38006b4fe319b5bb0c1badc09b30380c" due to: ' + o);
            }
        }
    },
    '(()=>{window.XMLHttpRequest.prototype.open=new Proxy(window.XMLHttpRequest.prototype.open,{apply:async(a,b,c)=>{const d=c[1];if("string"!=typeof d||0===d.length)return Reflect.apply(a,b,c);const e=/topaz\\.dai\\.viacomcbs\\.digital\\/ondemand\\/hls\\/.*\\.m3u8/.test(d),f=/dai\\.google\\.com\\/ondemand\\/v.*\\/hls\\/content\\/.*\\/vid\\/.*\\/stream/.test(d);return(e||f)&&b.addEventListener("readystatechange",function(){if(4===b.readyState){const a=b.response;if(Object.defineProperty(b,"response",{writable:!0}),Object.defineProperty(b,"responseText",{writable:!0}),f&&(null!==a&&void 0!==a&&a.ad_breaks&&(a.ad_breaks=[]),null!==a&&void 0!==a&&a.apple_tv&&(a.apple_tv={})),e){const c=a.replaceAll(/#EXTINF:(\\d|\\d\\.\\d+)\\,\\nhttps:\\/\\/redirector\\.googlevideo\\.com\\/videoplayback\\?[\\s\\S]*?&source=dclk_video_ads&[\\s\\S]*?\\n/g,"");b.response=c,b.responseText=c}}}),Reflect.apply(a,b,c)}})})();': {
        uniqueId: "a8c6f78e34ee76b7ae128e62027dec2f",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.a8c6f78e34ee76b7ae128e62027dec2f !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "a8c6f78e34ee76b7ae128e62027dec2f" due to: ' + e);
            }
        }
    },
    "(function(){window.twttr={conversion:{trackPid:function(){}}}})();": {
        uniqueId: "b207994a134acba69e58503a5393b31a",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.b207994a134acba69e58503a5393b31a !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "b207994a134acba69e58503a5393b31a" due to: ' + e);
            }
        }
    },
    "(() => { var ReplaceMap = {adBreaks: [], adState: null, currentAdBreak: 'undefined'}; Object.defineProperty = new Proxy(Object.defineProperty, { apply: (target, thisArg, ArgsList) => { var Original = Reflect.apply(target, thisArg, ArgsList); if (ArgsList[1] == 'getAdBreaks' || ArgsList[1] == 'getAdsDisplayStringParams') { return Original[ArgsList[1]] = function() {}; } else if (ArgsList[1] == 'adBreaks' || ArgsList[1] == 'currentAdBreak' || typeof Original['adBreaks'] !== 'undefined') { for (var [key, value] of Object.entries(Original)) { if (typeof ReplaceMap[key] !== 'undefined' && ReplaceMap[key] !== 'undefined') { Original[key] = ReplaceMap[key]; } else if (typeof ReplaceMap[key] !== 'undefined' && ReplaceMap[key] === 'undefined') { Original[key] = undefined; } } return Original; } else { return Original; }}})})();": {
        uniqueId: "9072dab3b9fec602e942bbd140d1f7ea",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["9072dab3b9fec602e942bbd140d1f7ea"] !== e) {
                    (() => {
                        var e = {
                            adBreaks: [],
                            adState: null,
                            currentAdBreak: "undefined"
                        };
                        Object.defineProperty = new Proxy(Object.defineProperty, {
                            apply: (r, d, t) => {
                                var n = Reflect.apply(r, d, t);
                                if ("getAdBreaks" == t[1] || "getAdsDisplayStringParams" == t[1]) return n[t[1]] = function() {};
                                if ("adBreaks" == t[1] || "currentAdBreak" == t[1] || void 0 !== n.adBreaks) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "9072dab3b9fec602e942bbd140d1f7ea" due to: ' + e);
            }
        }
    },
    '(()=>{const a=window.fetch,b={apply:async(b,c,d)=>{const e=d[0]instanceof Request?d[0].url:d[0];if("string"!=typeof e||0===e.length)return Reflect.apply(b,c,d);if(e.includes("uplynk.com/")&&e.includes(".m3u8")){const b=await a(...d);let c=await b.text();return c=c.replaceAll(/#UPLYNK-SEGMENT: \\S*\\,ad\\s[\\s\\S]+?((#UPLYNK-SEGMENT: \\S+\\,segment)|(#EXT-X-ENDLIST))/g,"$1"),new Response(c)}return Reflect.apply(b,c,d)}};try{window.fetch=new Proxy(window.fetch,b)}catch(a){}})();': {
        uniqueId: "f2cc35b643de55322eb7ef4e3811aa59",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.f2cc35b643de55322eb7ef4e3811aa59 !== e) {
                    (() => {
                        const e = window.fetch, t = {
                            apply: async (t, n, c) => {
                                const o = c[0] instanceof Request ? c[0].url : c[0];
                                if ("string" != typeof o || 0 === o.length) return Reflect.apply(t, n, c);
                                if (o.includes("uplynk.com/") && o.includes(".m3u8")) {
                                    const t = await e(...c);
                                    let n = await t.text();
                                    return n = n.replaceAll(/#UPLYNK-SEGMENT: \S*\,ad\s[\s\S]+?((#UPLYNK-SEGMENT: \S+\,segment)|(#EXT-X-ENDLIST))/g, "$1"), 
                                    new Response(n);
                                }
                                return Reflect.apply(t, n, c);
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "f2cc35b643de55322eb7ef4e3811aa59" due to: ' + e);
            }
        }
    },
    '(()=>{window.XMLHttpRequest.prototype.open=new Proxy(window.XMLHttpRequest.prototype.open,{apply:async(a,b,c)=>{const d=c[1];return"string"!=typeof d||0===d.length?Reflect.apply(a,b,c):(d.match(/pubads\\.g\\.doubleclick.net\\/ondemand\\/hls\\/.*\\.m3u8/)&&b.addEventListener("readystatechange",function(){if(4===b.readyState){const a=b.response;Object.defineProperty(b,"response",{writable:!0}),Object.defineProperty(b,"responseText",{writable:!0});const c=a.replaceAll(/#EXTINF:(\\d|\\d\\.\\d+)\\,\\nhttps:\\/\\/redirector\\.googlevideo\\.com\\/videoplayback\\?[\\s\\S]*?&source=dclk_video_ads&[\\s\\S]*?\\n/g,"");b.response=c,b.responseText=c}}),Reflect.apply(a,b,c))}})})();': {
        uniqueId: "0664f2a8c7617fced3e7790a26b1c7f8",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["0664f2a8c7617fced3e7790a26b1c7f8"] !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "0664f2a8c7617fced3e7790a26b1c7f8" due to: ' + e);
            }
        }
    },
    '(()=>{const a=window.fetch;window.fetch=new Proxy(window.fetch,{apply:async(b,c,d)=>{const e=d[0];if("string"!=typeof e||0===e.length)return Reflect.apply(b,c,d);if(e.match(/pubads\\.g\\.doubleclick\\.net\\/ondemand\\/.*\\/content\\/.*\\/vid\\/.*\\/streams\\/.*\\/manifest\\.mpd|pubads\\.g\\.doubleclick.net\\/ondemand\\/hls\\/.*\\.m3u8/)){const b=await a(...d);let c=await b.text();return c=c.replaceAll(/<Period id="(pre|mid|post)-roll-.-ad-[\\s\\S]*?>[\\s\\S]*?<\\/Period>|#EXTINF:(\\d|\\d\\.\\d+)\\,\\nhttps:\\/\\/redirector\\.googlevideo\\.com\\/videoplayback\\?[\\s\\S]*?&source=dclk_video_ads&[\\s\\S]*?\\n/g,""),new Response(c)}return Reflect.apply(b,c,d)}})})();': {
        uniqueId: "cce15678b7fd141ec70a16bc1f01aa96",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.cce15678b7fd141ec70a16bc1f01aa96 !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "cce15678b7fd141ec70a16bc1f01aa96" due to: ' + e);
            }
        }
    },
    "(()=>{window.FAVE=window.FAVE||{};const s={set:(s,e,n,a)=>{if(s?.settings?.ads?.ssai?.prod?.clips?.enabled&&(s.settings.ads.ssai.prod.clips.enabled=!1),s?.player?.instances)for(var i of Object.keys(s.player.instances))s.player.instances[i]?.configs?.ads?.ssai?.prod?.clips?.enabled&&(s.player.instances[i].configs.ads.ssai.prod.clips.enabled=!1);return Reflect.set(s,e,n,a)}};window.FAVE=new Proxy(window.FAVE,s)})();": {
        uniqueId: "a7c2de548bf7bc2a7f3781d87742cae1",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.a7c2de548bf7bc2a7f3781d87742cae1 !== e) {
                    (() => {
                        window.FAVE = window.FAVE || {};
                        const e = {
                            set: (e, s, a, n) => {
                                if (e?.settings?.ads?.ssai?.prod?.clips?.enabled && (e.settings.ads.ssai.prod.clips.enabled = !1), 
                                e?.player?.instances) for (var i of Object.keys(e.player.instances)) e.player.instances[i]?.configs?.ads?.ssai?.prod?.clips?.enabled && (e.player.instances[i].configs.ads.ssai.prod.clips.enabled = !1);
                                return Reflect.set(e, s, a, n);
                            }
                        };
                        window.FAVE = new Proxy(window.FAVE, e);
                    })();
                    Object.defineProperty(Window.prototype.toString, "a7c2de548bf7bc2a7f3781d87742cae1", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "a7c2de548bf7bc2a7f3781d87742cae1" due to: ' + e);
            }
        }
    },
    "(()=>{window.PostRelease={Start(){}}})();": {
        uniqueId: "f442d027f2647247aaa89f75941826f0",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.f442d027f2647247aaa89f75941826f0 !== e) {
                    window.PostRelease = {
                        Start() {}
                    };
                    Object.defineProperty(Window.prototype.toString, "f442d027f2647247aaa89f75941826f0", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "f442d027f2647247aaa89f75941826f0" due to: ' + e);
            }
        }
    },
    '(()=>{window.com_adswizz_synchro_decorateUrl=function(a){if("string"===typeof a&&a.startsWith("http"))return a}})();': {
        uniqueId: "2b3b012135adb550eb133e7becf3e060",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["2b3b012135adb550eb133e7becf3e060"] !== e) {
                    window.com_adswizz_synchro_decorateUrl = function(e) {
                        if ("string" == typeof e && e.startsWith("http")) return e;
                    };
                    Object.defineProperty(Window.prototype.toString, "2b3b012135adb550eb133e7becf3e060", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "2b3b012135adb550eb133e7becf3e060" due to: ' + e);
            }
        }
    },
    '(()=>{window.XMLHttpRequest.prototype.open=new Proxy(window.XMLHttpRequest.prototype.open,{apply:async(a,b,c)=>{const d=c[1];return"string"!=typeof d||0===d.length?Reflect.apply(a,b,c):(d.match(/manifest\\..*\\.theplatform\\.com\\/.*\\/.*\\.m3u8\\?.*|manifest\\..*\\.theplatform\\.com\\/.*\\/*\\.meta.*/)&&b.addEventListener("readystatechange",function(){if(4===b.readyState){const a=b.response;Object.defineProperty(b,"response",{writable:!0}),Object.defineProperty(b,"responseText",{writable:!0});const c=a.replaceAll(/#EXTINF:.*\\n.*tvessaiprod\\.nbcuni\\.com\\/video\\/[\\s\\S]*?#EXT-X-DISCONTINUITY|#EXT-X-VMAP-AD-BREAK[\\s\\S]*?#EXT-X-ENDLIST/g,"");b.response=c,b.responseText=c}}),Reflect.apply(a,b,c))}})})();': {
        uniqueId: "6f3d40e53e83daab7ecb0b1ff3b3d011",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["6f3d40e53e83daab7ecb0b1ff3b3d011"] !== e) {
                    window.XMLHttpRequest.prototype.open = new Proxy(window.XMLHttpRequest.prototype.open, {
                        apply: async (e, t, o) => {
                            const n = o[1];
                            return "string" != typeof n || 0 === n.length || n.match(/manifest\..*\.theplatform\.com\/.*\/.*\.m3u8\?.*|manifest\..*\.theplatform\.com\/.*\/*\.meta.*/) && t.addEventListener("readystatechange", (function() {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "6f3d40e53e83daab7ecb0b1ff3b3d011" due to: ' + e);
            }
        }
    },
    '(()=>{let e,t=!1;const n=function(){},o=function(t,n){if("function"==typeof n)try{window.KalturaPlayer?n([]):e=n}catch(e){console.error(e)}};let r;Object.defineProperty(window,"PWT",{value:{requestBids:o,generateConfForGPT:o,addKeyValuePairsToGPTSlots:n,generateDFPURL:n}}),Object.defineProperty(window,"KalturaPlayer",{get:function(){return r},set:function(n){r=n,t||(t=!0,e([]))}})})();': {
        uniqueId: "03163849cc3681e88adf734700efefc6",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["03163849cc3681e88adf734700efefc6"] !== e) {
                    (() => {
                        let e, t = !1;
                        const o = function() {}, r = function(t, o) {
                            if ("function" == typeof o) try {
                                window.KalturaPlayer ? o([]) : e = o;
                            } catch (e) {
                                console.error(e);
                            }
                        };
                        let n;
                        Object.defineProperty(window, "PWT", {
                            value: {
                                requestBids: r,
                                generateConfForGPT: r,
                                addKeyValuePairsToGPTSlots: o,
                                generateDFPURL: o
                            }
                        }), Object.defineProperty(window, "KalturaPlayer", {
                            get: function() {
                                return n;
                            },
                            set: function(o) {
                                n = o, t || (t = !0, e([]));
                            }
                        });
                    })();
                    Object.defineProperty(Window.prototype.toString, "03163849cc3681e88adf734700efefc6", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "03163849cc3681e88adf734700efefc6" due to: ' + e);
            }
        }
    },
    '(()=>{const a=function(){},b=function(c,a){if("function"==typeof a)try{a([])}catch(a){console.error(a)}};Object.defineProperty(window,"PWT",{value:{requestBids:b,generateConfForGPT:b,addKeyValuePairsToGPTSlots:a,generateDFPURL:a}})})();': {
        uniqueId: "7a089dd23e47e252f413e97c2c706704",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["7a089dd23e47e252f413e97c2c706704"] !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "7a089dd23e47e252f413e97c2c706704" due to: ' + e);
            }
        }
    },
    "(function(){window.setTimeout=new Proxy(window.setTimeout,{apply:(a,b,c)=>c&&c[0]&&/if\\(!/.test(c[0].toString())&&c[1]&&1e4===c[1]?(c[1]*=.01,Reflect.apply(a,b,c)):Reflect.apply(a,b,c)});window.setInterval=new Proxy(window.setInterval,{apply:(a,b,c)=>c&&c[0]&&/initWait/.test(c[0].toString())&&c[1]&&1e3===c[1]?(c[1]*=.01,Reflect.apply(a,b,c)):Reflect.apply(a,b,c)})})();": {
        uniqueId: "651f882509e2b8548706a310152c5126",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["651f882509e2b8548706a310152c5126"] !== e) {
                    !function() {
                        window.setTimeout = new Proxy(window.setTimeout, {
                            apply: (e, t, o) => o && o[0] && /if\(!/.test(o[0].toString()) && o[1] && 1e4 === o[1] ? (o[1] *= .01, 
                            Reflect.apply(e, t, o)) : Reflect.apply(e, t, o)
                        });
                        window.setInterval = new Proxy(window.setInterval, {
                            apply: (e, t, o) => o && o[0] && /initWait/.test(o[0].toString()) && o[1] && 1e3 === o[1] ? (o[1] *= .01, 
                            Reflect.apply(e, t, o)) : Reflect.apply(e, t, o)
                        });
                    }();
                    Object.defineProperty(Window.prototype.toString, "651f882509e2b8548706a310152c5126", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "651f882509e2b8548706a310152c5126" due to: ' + e);
            }
        }
    },
    "(()=>{window.turner_getTransactionId=turner_getGuid=function(){},window.AdFuelUtils={getUMTOCookies(){}}})();": {
        uniqueId: "b023e1f40db016717028fe62421a3285",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.b023e1f40db016717028fe62421a3285 !== e) {
                    window.turner_getTransactionId = turner_getGuid = function() {}, window.AdFuelUtils = {
                        getUMTOCookies() {}
                    };
                    Object.defineProperty(Window.prototype.toString, "b023e1f40db016717028fe62421a3285", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "b023e1f40db016717028fe62421a3285" due to: ' + e);
            }
        }
    },
    '(function(){window.adsbygoogle={loaded:!0,push:function(a){if(null!==a&&a instanceof Object&&"Object"===a.constructor.name)for(let b in a)if("function"==typeof a[b])try{a[b].call()}catch(a){console.error(a)}}}})();': {
        uniqueId: "2ba6aeb1954873824c6148e3102a091c",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["2ba6aeb1954873824c6148e3102a091c"] !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "2ba6aeb1954873824c6148e3102a091c" due to: ' + e);
            }
        }
    },
    "(()=>{document.addEventListener('DOMContentLoaded',()=>{setTimeout(function(){(function(){window.AdFuel={queueRegistry(){},destroySlots(){}}})()},500);})})();": {
        uniqueId: "d4ca083794994e22dcb36f8fd698d98e",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.d4ca083794994e22dcb36f8fd698d98e !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "d4ca083794994e22dcb36f8fd698d98e" due to: ' + e);
            }
        }
    },
    "(function(){var a={setConfig:function(){},aliasBidder:function(){},removeAdUnit:function(){},que:[push=function(){}]};window.pbjs=a})();": {
        uniqueId: "0d58ac66c89ef6fa9de7481fe82dcc9b",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["0d58ac66c89ef6fa9de7481fe82dcc9b"] !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "0d58ac66c89ef6fa9de7481fe82dcc9b" due to: ' + e);
            }
        }
    },
    "window.addEventListener('DOMContentLoaded', function() { document.body.innerHTML = document.body.innerHTML.replace(/Adverts/g, \"\"); })": {
        uniqueId: "3238470ccdeda8472a95e2bbb72a4f2a",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["3238470ccdeda8472a95e2bbb72a4f2a"] !== e) {
                    window.addEventListener("DOMContentLoaded", (function() {
                        document.body.innerHTML = document.body.innerHTML.replace(/Adverts/g, "");
                    }));
                    Object.defineProperty(Window.prototype.toString, "3238470ccdeda8472a95e2bbb72a4f2a", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "3238470ccdeda8472a95e2bbb72a4f2a" due to: ' + e);
            }
        }
    },
    "!function(){window.rTimer=function(){};window.jitaJS={rtk:{refreshAdUnits:function(){}}};}();": {
        uniqueId: "642c5e10be75a4087f7ce1326ec9a7ee",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["642c5e10be75a4087f7ce1326ec9a7ee"] !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "642c5e10be75a4087f7ce1326ec9a7ee" due to: ' + e);
            }
        }
    },
    '(()=>{const t=new MutationObserver((t=>{for(let e of t){const t=e.target;if(t?.querySelector?.("div:not([class], [id]):first-child + div:not([class], [id]):not([class], [id]):last-child")){const e=t.querySelector("div:not([class], [id]):last-child");if("#advertisement"===e?.shadowRoot?.querySelector?.("div:not([class], [id]) > div:not([class], [id])")?.textContent)try{e.remove()}catch(t){console.trace(t)}}}})),e={apply:(e,o,c)=>{try{c[0].mode="open"}catch(t){console.error(t)}const s=Reflect.apply(e,o,c);return t.observe(s,{subtree:!0,childList:!0}),s}};window.Element.prototype.attachShadow=new Proxy(window.Element.prototype.attachShadow,e)})();': {
        uniqueId: "f38ee646df1545faf01c3d32666dd4c7",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.f38ee646df1545faf01c3d32666dd4c7 !== e) {
                    (() => {
                        const e = new MutationObserver((e => {
                            for (let t of e) {
                                const o = t.target;
                                if (o?.querySelector?.("div:not([class], [id]):first-child + div:not([class], [id]):not([class], [id]):last-child")) {
                                    const t = o.querySelector("div:not([class], [id]):last-child");
                                    if ("#advertisement" === t?.shadowRoot?.querySelector?.("div:not([class], [id]) > div:not([class], [id])")?.textContent) try {
                                        t.remove();
                                    } catch (e) {
                                        console.trace(e);
                                    }
                                }
                            }
                        })), t = {
                            apply: (t, o, r) => {
                                try {
                                    r[0].mode = "open";
                                } catch (e) {
                                    console.error(e);
                                }
                                const c = Reflect.apply(t, o, r);
                                return e.observe(c, {
                                    subtree: !0,
                                    childList: !0
                                }), c;
                            }
                        };
                        window.Element.prototype.attachShadow = new Proxy(window.Element.prototype.attachShadow, t);
                    })();
                    Object.defineProperty(Window.prototype.toString, "f38ee646df1545faf01c3d32666dd4c7", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "f38ee646df1545faf01c3d32666dd4c7" due to: ' + e);
            }
        }
    },
    'document.cookie="vpn=1; path=/;";': {
        uniqueId: "c30e73df868a56abad82ef46aea39100",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.c30e73df868a56abad82ef46aea39100 !== e) {
                    document.cookie = "vpn=1; path=/;";
                    Object.defineProperty(Window.prototype.toString, "c30e73df868a56abad82ef46aea39100", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "c30e73df868a56abad82ef46aea39100" due to: ' + e);
            }
        }
    },
    "(()=>{document.addEventListener(\"DOMContentLoaded\",(()=>{ if(typeof jQuery) { jQuery('#SearchButtom').unbind('click'); } }));})();": {
        uniqueId: "1e2d5574e33a449dcd46c38824d46820",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["1e2d5574e33a449dcd46c38824d46820"] !== e) {
                    document.addEventListener("DOMContentLoaded", (() => {
                        jQuery("#SearchButtom").unbind("click");
                    }));
                    Object.defineProperty(Window.prototype.toString, "1e2d5574e33a449dcd46c38824d46820", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "1e2d5574e33a449dcd46c38824d46820" due to: ' + e);
            }
        }
    },
    '(()=>{document.addEventListener("DOMContentLoaded",(()=>{ if(typeof videofunc) { videofunc(); } }));})();': {
        uniqueId: "c89cf796658574c24a11e4139372f1f6",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.c89cf796658574c24a11e4139372f1f6 !== e) {
                    document.addEventListener("DOMContentLoaded", (() => {
                        videofunc();
                    }));
                    Object.defineProperty(Window.prototype.toString, "c89cf796658574c24a11e4139372f1f6", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "c89cf796658574c24a11e4139372f1f6" due to: ' + e);
            }
        }
    },
    'document.cookie="p3006=1; path=/;";': {
        uniqueId: "d2d456e85d536f31a032f2a730cbde22",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.d2d456e85d536f31a032f2a730cbde22 !== e) {
                    document.cookie = "p3006=1; path=/;";
                    Object.defineProperty(Window.prototype.toString, "d2d456e85d536f31a032f2a730cbde22", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "d2d456e85d536f31a032f2a730cbde22" due to: ' + e);
            }
        }
    },
    'document.cookie="rpuShownDesktop=1; path=/;";': {
        uniqueId: "651f3ee34f9ac7a2ac075d8fab9c1c17",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["651f3ee34f9ac7a2ac075d8fab9c1c17"] !== e) {
                    document.cookie = "rpuShownDesktop=1; path=/;";
                    Object.defineProperty(Window.prototype.toString, "651f3ee34f9ac7a2ac075d8fab9c1c17", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "651f3ee34f9ac7a2ac075d8fab9c1c17" due to: ' + e);
            }
        }
    },
    '(function(){var a;Object.defineProperty(window,"initLbjs",{get:function(){return a},set:function(c){a=function(a,b){b.AdPop=!1;return c(a,b)}}})})();': {
        uniqueId: "7872a331bbac5d34b400cc3369c46738",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["7872a331bbac5d34b400cc3369c46738"] !== e) {
                    !function() {
                        var e;
                        Object.defineProperty(window, "initLbjs", {
                            get: function() {
                                return e;
                            },
                            set: function(t) {
                                e = function(e, n) {
                                    n.AdPop = !1;
                                    return t(e, n);
                                };
                            }
                        });
                    }();
                    Object.defineProperty(Window.prototype.toString, "7872a331bbac5d34b400cc3369c46738", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "7872a331bbac5d34b400cc3369c46738" due to: ' + e);
            }
        }
    },
    '(function(){var d=(new URL(window.location.href)).searchParams.get("cr");try{var a=atob(d)}catch(b){}try{new URL(a);var c=!0}catch(b){c=!1}if(c)try{window.location=a}catch(b){}})();': {
        uniqueId: "c1d6890e971fdba258e3692075d82479",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.c1d6890e971fdba258e3692075d82479 !== e) {
                    !function() {
                        var e = new URL(window.location.href).searchParams.get("cr");
                        try {
                            var t = atob(e);
                        } catch (e) {}
                        try {
                            new URL(t);
                            var r = !0;
                        } catch (e) {
                            r = !1;
                        }
                        if (r) try {
                            window.location = t;
                        } catch (e) {}
                    }();
                    Object.defineProperty(Window.prototype.toString, "c1d6890e971fdba258e3692075d82479", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "c1d6890e971fdba258e3692075d82479" due to: ' + e);
            }
        }
    },
    '(function(){if(-1!=window.location.href.indexOf("/intro-mm"))for(var c=document.cookie.split(";"),b=0;b<c.length;b++){var a=c[b];a=a.split("=");"redirect_url_to_intro"==a[0]&&window.location.replace(decodeURIComponent(a[1]))}})();': {
        uniqueId: "f09a7b4667c1146d3ffd2348387597d8",
        func: () => {
            try {
                const o = "done";
                if (Window.prototype.toString.f09a7b4667c1146d3ffd2348387597d8 !== o) {
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
                }
            } catch (o) {
                console.error('Error executing AG js rule with uniqueId "f09a7b4667c1146d3ffd2348387597d8" due to: ' + o);
            }
        }
    },
    "(function(){var c=document.addEventListener;document.addEventListener=function(a,b,d,e){\"mousedown\"!=a&&-1==b.toString().indexOf(':!!')&&c(a,b,d,e)}.bind(document); var b=window.setTimeout;window.setTimeout=function(a,c){if(!/;if\\(\\!/.test(a.toString()))return b(a,c)};})();": {
        uniqueId: "27ed43aa7951f19f9a24a3d955696ea3",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["27ed43aa7951f19f9a24a3d955696ea3"] !== e) {
                    !function() {
                        var e = document.addEventListener;
                        document.addEventListener = function(t, n, o, i) {
                            "mousedown" != t && -1 == n.toString().indexOf(":!!") && e(t, n, o, i);
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "27ed43aa7951f19f9a24a3d955696ea3" due to: ' + e);
            }
        }
    },
    "(function(){var c=document.addEventListener;document.addEventListener=function(a,b,d,e){\"mousedown\"!=a&&-1==b.toString().indexOf('Z4P')&&c(a,b,d,e)}.bind(document); var b=window.setTimeout;window.setTimeout=function(a,c){if(!/\\..4P\\(|=setTimeout\\(/.test(a.toString()))return b(a,c)};})();": {
        uniqueId: "16fc905e6e4d01b1d36604ce246bdcac",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["16fc905e6e4d01b1d36604ce246bdcac"] !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "16fc905e6e4d01b1d36604ce246bdcac" due to: ' + e);
            }
        }
    },
    "(function(){var c=document.addEventListener;document.addEventListener=function(a,b,d,e){\"click\"!=a&&-1==b.toString().indexOf('bi()')&&c(a,b,d,e)}.bind(document);})();": {
        uniqueId: "a9336ddeda1e9f4d8198cac4f6a59557",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.a9336ddeda1e9f4d8198cac4f6a59557 !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "a9336ddeda1e9f4d8198cac4f6a59557" due to: ' + e);
            }
        }
    },
    "(function(){var c=document.addEventListener;document.addEventListener=function(a,b,d,e){\"mousedown\"!=a&&-1==b.toString().indexOf('Z4P')&&c(a,b,d,e)}.bind(document); var b=window.setTimeout;window.setTimeout=function(a,c){if(!/Z4P/.test(a.toString()))return b(a,c)};})();": {
        uniqueId: "63f6bebe37e619f74c32a8b2415f86a2",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["63f6bebe37e619f74c32a8b2415f86a2"] !== e) {
                    !function() {
                        var e = document.addEventListener;
                        document.addEventListener = function(t, n, o, i) {
                            "mousedown" != t && -1 == n.toString().indexOf("Z4P") && e(t, n, o, i);
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "63f6bebe37e619f74c32a8b2415f86a2" due to: ' + e);
            }
        }
    },
    "(function(){var c=document.addEventListener;document.addEventListener=function(a,b,d,e){\"click\"!=a&&-1==b.toString().indexOf('checkTarget')&&c(a,b,d,e)}.bind(document);})();": {
        uniqueId: "d4daff20eda39f5bfe997a60b5b65564",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.d4daff20eda39f5bfe997a60b5b65564 !== e) {
                    !function() {
                        var e = document.addEventListener;
                        document.addEventListener = function(t, n, d, o) {
                            "click" != t && -1 == n.toString().indexOf("checkTarget") && e(t, n, d, o);
                        }.bind(document);
                    }();
                    Object.defineProperty(Window.prototype.toString, "d4daff20eda39f5bfe997a60b5b65564", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "d4daff20eda39f5bfe997a60b5b65564" due to: ' + e);
            }
        }
    },
    '(function(){var c=document.addEventListener;document.addEventListener=function(a,b,d,e){"mouseup"!=a&&-1==b.toString().indexOf(`var U="click";var R=\'_blank\';var v="href";`)&&c(a,b,d,e)}.bind(document);})();': {
        uniqueId: "2e5eb7acf02c72e68933dbb1fd9704ba",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["2e5eb7acf02c72e68933dbb1fd9704ba"] !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "2e5eb7acf02c72e68933dbb1fd9704ba" due to: ' + e);
            }
        }
    },
    "(function(){ var observer=new MutationObserver(hide);observer.observe(document,{childList:!0,subtree:!0});function hide(){var e=document.querySelectorAll('span[data-nosnippet] > .q-box');e.forEach(function(e){var i=e.innerText;if(i){if(i!==void 0&&(!0===i.includes('Sponsored')||!0===i.includes('Ad by')||!0===i.includes('Promoted by'))){e.style=\"display:none!important;\"}}})} })();": {
        uniqueId: "9f6813ab855c342f13c90469c95da251",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["9f6813ab855c342f13c90469c95da251"] !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "9f6813ab855c342f13c90469c95da251" due to: ' + e);
            }
        }
    },
    "(function(){ var observer=new MutationObserver(hide);observer.observe(document,{childList:!0,subtree:!0});function hide(){var e=document.querySelectorAll('.paged_list_wrapper > .pagedlist_item');e.forEach(function(e){var i=e.innerHTML;if(i){if(i!==void 0&&(!0===i.includes('Hide This Ad<\\/span>'))){e.style=\"display:none!important;\"}}})} })();": {
        uniqueId: "17b3983e043325b0965b454cc7394766",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["17b3983e043325b0965b454cc7394766"] !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "17b3983e043325b0965b454cc7394766" due to: ' + e);
            }
        }
    },
    '!function(){new MutationObserver((function(){document.querySelectorAll("article > div[class] > div[class]").forEach((function(e){Object.keys(e).forEach((function(c){if(c.includes("__reactEvents")||c.includes("__reactProps")){c=e[c];try{c.children?.props?.adFragmentKey?.items&&e.parentNode.remove()}catch(c){}}}))}))})).observe(document,{childList:!0,subtree:!0});}();': {
        uniqueId: "54509270c0f548739cf1d7c18ae3d312",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["54509270c0f548739cf1d7c18ae3d312"] !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "54509270c0f548739cf1d7c18ae3d312" due to: ' + e);
            }
        }
    },
    '!function(){var e=0,r=[];new MutationObserver((function(){document.querySelectorAll("div[role=\'list\'] > div[role=\'listitem\']:not([style*=\'display: none\'])").forEach((function(i){Object.keys(i).forEach((function(s){if(s.includes("__reactFiber")||s.includes("__reactProps")){s=i[s];try{if(s.memoizedProps?.children?.props?.children?.props?.pin?.ad_destination_url||s.memoizedProps?.children?.props?.children?.props?.children?.props?.pin?.ad_destination_url||s.memoizedProps?.children?.props?.children?.props?.children?.props?.children?.props?.pin?.ad_destination_url){e++,i.style="display: none !important;";var n=i.querySelector(\'a[href] span[class*=" "]:last-child, a[href] div[class*=" "][style*="margin"]:last-child > div[class*=" "][style*="margin"] + div[class*=" "]:last-child\');n&&(r.push(["Ad blocked based on property ["+e+"] -> "+n.innerText]),console.table(r))}}catch(s){}}}))}))})).observe(document,{childList:!0,subtree:!0})}();': {
        uniqueId: "7a7cab56c614f1cf68ff032f1ca0c29d",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["7a7cab56c614f1cf68ff032f1ca0c29d"] !== e) {
                    !function() {
                        var e = 0, r = [];
                        new MutationObserver((function() {
                            document.querySelectorAll("div[role='list'] > div[role='listitem']:not([style*='display: none'])").forEach((function(i) {
                                Object.keys(i).forEach((function(o) {
                                    if (o.includes("__reactFiber") || o.includes("__reactProps")) {
                                        o = i[o];
                                        try {
                                            if (o.memoizedProps?.children?.props?.children?.props?.pin?.ad_destination_url || o.memoizedProps?.children?.props?.children?.props?.children?.props?.pin?.ad_destination_url || o.memoizedProps?.children?.props?.children?.props?.children?.props?.children?.props?.pin?.ad_destination_url) {
                                                e++, i.style = "display: none !important;";
                                                var c = i.querySelector('a[href] span[class*=" "]:last-child, a[href] div[class*=" "][style*="margin"]:last-child > div[class*=" "][style*="margin"] + div[class*=" "]:last-child');
                                                c && (r.push([ "Ad blocked based on property [" + e + "] -> " + c.innerText ]), 
                                                console.table(r));
                                            }
                                        } catch (o) {}
                                    }
                                }));
                            }));
                        })).observe(document, {
                            childList: !0,
                            subtree: !0
                        });
                    }();
                    Object.defineProperty(Window.prototype.toString, "7a7cab56c614f1cf68ff032f1ca0c29d", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "7a7cab56c614f1cf68ff032f1ca0c29d" due to: ' + e);
            }
        }
    },
    '!function(){var e=new MutationObserver(function(){var m=document.querySelectorAll("div[id^=\'mount_\']");{var e;e=0<m.length?document.querySelectorAll(\'div[role="feed"] > div[data-pagelet^="FeedUnit"] > div[class]:not([style*="height"])\'):document.querySelectorAll(\'[id^="substream"] > div:not(.hidden_elem) div[id^="hyperfeed_story_id"]\')}e.forEach(function(e){function n(e,n){for(0<m.length?"0"==(h=e.querySelectorAll(\'div[role="article"] span[dir="auto"] > a > span > span > span[data-content]\')).length&&(h=e.querySelectorAll(\'div[role="article"] span[dir="auto"] > a > span[aria-label]\')):h=e.querySelectorAll(".userContentWrapper h5 + div[data-testid] a [class] [class]"),socheck=0;socheck<h.length;socheck++)h[socheck].innerText.contains(n)&&(p=["1"],d=["1"],u=["1"],i=r=l=1,socheck=h.length)}function t(e,n,t,c,a){for(0<m.length?"0"==(h=e.querySelectorAll(\'div[role="article"] span[dir="auto"] > a > span > span > span[data-content]\')).length&&(h=e.querySelectorAll(\'div[role="article"] span[dir="auto"] div[role="button"][tabindex]\')):h=e.querySelectorAll(".userContentWrapper h5 + div[data-testid] > span a > [class] [class]"),"0"==h.length&&(h=e.querySelectorAll(\'div[role="article"] span[dir="auto"] > a > span[aria-label]\')),socheck=0;socheck<h.length;socheck++){spancheck=0,1<h.length?(spancheck=h[socheck].querySelectorAll("span")[0],0==spancheck&&(spancheck=h[socheck].querySelectorAll("b")[0])):(spancheck=h[0].querySelectorAll("span")[socheck],0==spancheck&&(spancheck=h[0].querySelectorAll("b")[socheck]));var o=h[0];if(0!=spancheck&&spancheck){if(2==spancheck.children.length&&0<m.length)for(spancheck=spancheck.querySelectorAll("span:not([style])"),spcheck=0;spcheck<spancheck.length;spcheck++)spancheck[spcheck].innerText.contains(n)?s=1:!spancheck[spcheck].innerText.contains(t)||0!=spancheck[spcheck].offsetTop||spancheck[spcheck].innerText.contains(n)||spancheck[spcheck].innerText.contains(c)||spancheck[spcheck].innerText.contains(a)?!spancheck[spcheck].innerText.contains(c)||0!=spancheck[spcheck].offsetTop||spancheck[spcheck].innerText.contains(t)||spancheck[spcheck].innerText.contains(n)||spancheck[spcheck].innerText.contains(a)?!spancheck[spcheck].innerText.contains(a)||0!=spancheck[spcheck].offsetTop||spancheck[spcheck].innerText.contains(t)||spancheck[spcheck].innerText.contains(c)||spancheck[spcheck].innerText.contains(n)||(u=["1"],i=1):(d=["1"],r=1):(p=["1"],l=1);0==m.length&&((!(spancheck.innerText.contains(n)&&0==spancheck.offsetTop||h[0].innerText.contains(n)&&0==h[0].offsetTop)||spancheck.innerText.contains(t)&&!h[0].innerText.contains(t)||spancheck.innerText.contains(c)&&!h[0].innerText.contains(c)||spancheck.innerText.contains(a)&&!h[0].innerText.contains(a))&&(!o.innerText.contains(n)||0!=o.offsetTop||o.innerText.contains(t)||o.innerText.contains(c)||o.innerText.contains(a))?!spancheck.innerText.contains(t)||0!=spancheck.offsetTop||spancheck.innerText.contains(n)||spancheck.innerText.contains(c)||spancheck.innerText.contains(a)?!spancheck.innerText.contains(c)||0!=spancheck.offsetTop||spancheck.innerText.contains(t)||spancheck.innerText.contains(n)||spancheck.innerText.contains(a)?!spancheck.innerText.contains(a)||0!=spancheck.offsetTop||spancheck.innerText.contains(t)||spancheck.innerText.contains(c)||spancheck.innerText.contains(n)||(u=["1"],i=1):(d=["1"],r=1):(p=["1"],l=1):s=1)}}}function c(e,n,t,c,a){u=0<m.length?(h=e.querySelectorAll(\'div[role="article"] span[dir="auto"] > a > span span[data-content=\'+n+"]"),p=e.querySelectorAll(\'div[role="article"] span[dir="auto"] > a > span span[data-content=\'+t+"]"),d=e.querySelectorAll(\'div[role="article"] span[dir="auto"] > a > span span[data-content=\'+c+"]"),e.querySelectorAll(\'div[role="article"] span[dir="auto"] > a > span span[data-content=\'+a+"]")):(h=e.querySelectorAll(".userContentWrapper h5 + div[data-testid] a [data-content="+n+"]"),p=e.querySelectorAll(".userContentWrapper h5 + div[data-testid] a [data-content="+t+"]"),d=e.querySelectorAll(".userContentWrapper h5 + div[data-testid] a [data-content="+c+"]"),e.querySelectorAll(".userContentWrapper h5 + div[data-testid] a [data-content="+a+"]"))}var s=0,l=0,r=0,i=0,h=0,p=0,d=0,u=0,a=e.querySelectorAll("div[style=\'width: 100%\'] > a[href*=\'oculus.com/quest\'] > div"),o=document.querySelector("[lang]"),k=document.querySelectorAll("link[rel=\'preload\'][href*=\'/l/\']");o=o?document.querySelector("[lang]").lang:"en";var y,g=e.querySelectorAll(\'a[ajaxify*="ad_id"] > span\'),f=e.querySelectorAll(\'a[href*="ads/about"]\'),S=e.querySelectorAll(\'a[href*="https://www.facebook.com/business/help"]\');if("display: none !important;"!=e.getAttribute("style")&&!e.classList.contains("hidden_elem")&&(0<g.length||0<f.length||0<S.length?(T+=1,0<m.length?(""==(y=e.querySelectorAll("a[href]")[0].innerText)&&(y=e.querySelectorAll("a[href]")[1].innerText),""==y&&(y=e.querySelectorAll("a[href]")[0].querySelectorAll("a[aria-label]")[0].getAttribute("aria-label"))):y=e.querySelectorAll("a[href]")[2].innerText,console.log("--------"),console.log("Ad hidden from: "+y),console.log("Total ads hidden: "+T),console.log("F length: "+g.length),console.log("H length: "+f.length),console.log("I length (Paid partnership): "+S.length),console.log("--------"),e.style="display:none!important;"):0<a.length?(T+=1,y="Facebook",console.log("--------"),console.log("Ad hidden from: "+y),console.log("Total ads hidden: "+T),console.log("Non-declared ad"),console.log("--------"),e.style="display:none!important;"):"af"==o?n(e,"Geborg"):"de"==o||"nl"==o?c(e,"G","e","s","n"):"am"==o?n(e,"የተከፈለበት ማስታወቂያ"):"ar"==o?n(e,"مُموَّل"):"as"==o?n(e,"পৃষ্ঠপোষকতা কৰা"):"az"==o?n(e,"Sponsor dəstəkli"):"co"==o?n(e,"Spunsurizatu"):"bs"==o||"sl"==o||"cs"==o?c(e,"S","p","z","n"):"da"==o||"en"==o||"et"==o||"fy"==o||"it"==o||"ku"==o||"nb"==o||"nn"==o||"pl"==o||"sq"==o||"sv"==o||"zz"==o?0<m.length?k[0].href.contains("en_UD")?n(e,"pəɹosuodS"):k[0].href.contains("ja_KS")?n(e,"広告"):k[0].href.contains("tz_MA")?n(e,"ⵉⴷⵍ"):k[0].href.contains("sy_SY")?n(e,"ܒܘܕܩܐ ܡܡܘܘܢܐ"):k[0].href.contains("cb_IQ")?n(e,"پاڵپشتیکراو"):k[0].href.contains("ar_AR")?n(e,"مُموَّل"):k[0].href.contains("sz_PL")?n(e,"Szpōnzorowane"):k[0].href.contains("eo_EO")?n(e,"Reklamo"):k[0].href.contains("es_LA")?c(e,"P","u","c","d"):(c(e,"S","p","s","n"),"0"==h.length&&t(e,"S","p","s","n"),"0"==h.length&&n(e,"Sponsored")):document.querySelector("body").className.includes("Locale_en_UD")?n(e,"pəɹosuodS"):document.querySelector("body").className.includes("ja_KS")?n(e,"広告"):document.querySelector("body").className.includes("tz_MA")?n(e,"ⵉⴷⵍ"):document.querySelector("body").className.includes("sy_SY")?n(e,"ܒܘܕܩܐ ܡܡܘܘܢܐ"):document.querySelector("body").className.includes("cb_IQ")?n(e,"پاڵپشتیکراو"):document.querySelector("body").className.includes("ar_AR")?n(e,"مُموَّل"):document.querySelector("body").className.includes("sz_PL")?n(e,"Szpōnzorowane"):document.querySelector("body").className.includes("eo_EO")?n(e,"Reklamo"):document.querySelector("body").className.includes("es_LA")?c(e,"P","u","c","d"):(c(e,"S","p","s","n"),"0"==h.length&&t(e,"S","p","s","n")):"be"==o?n(e,"Рэклама"):"bg"==o?n(e,"Спонсорирано"):"mk"==o?n(e,"Спонзорирано"):"br"==o?n(e,"Paeroniet"):"ca"==o?n(e,"Patrocinat"):"gl"==o||"pt"==o?(n(e,"Patrocinado"),"0"==l&&c(e,"P","a","c","o")):"bn"==o?n(e,"সৌজন্যে"):"cb"==o?n(e,"پاڵپشتیکراو"):"cx"==o?c(e,"G","i","s","n"):"cy"==o?n(e,"Noddwyd"):"el"==o?n(e,"Χορηγούμενη"):"eo"==o?n(e,"Reklamo"):"es"==o?c(e,"P","u","c","d"):"eu"==o?n(e,"Babestua"):"fa"==o?n(e,"دارای پشتیبانی مالی"):"ff"==o?n(e,"Yoɓanaama"):"fi"==o?n(e,"Sponsoroitu"):"fo"==o?n(e,"Stuðlað"):"fr"==o?0<m.length?k[0].href.contains("fr_FR")?c(e,"S","p","s","n"):c(e,"C","o","m","n"):document.querySelector("body").className.includes("Locale_fr_FR")?c(e,"S","p","s","n"):c(e,"C","o","m","n"):"ga"==o?n(e,"Urraithe"):"gn"==o?n(e,"Oñepatrosinapyre"):"gu"==o?n(e,"પ્રાયોજિત"):"ha"==o?n(e,"Daukar Nauyi"):"he"==o?n(e,"ממומן"):"hr"==o?n(e,"Plaćeni oglas"):"ht"==o?n(e,"Peye"):"ne"==o||"mr"==o||"hi"==o?n(e,"प्रायोजित"):"hu"==o?c(e,"H","i","r","d"):"hy"==o?n(e,"Գովազդային"):"id"==o?c(e,"B","e","p","n"):"is"==o?n(e,"Kostað"):"ja"==o?n(e,"広告"):"ms"==o?n(e,"Ditaja"):"jv"==o?n(e,"Disponsori"):"ka"==o?n(e,"რეკლამა"):"kk"==o?n(e,"Демеушілік көрсеткен"):"km"==o?n(e,"បានឧបត្ថម្ភ"):"kn"==o?n(e,"ಪ್ರಾಯೋಜಿತ"):"ko"==o?n(e,"Sponsored"):"ky"==o?n(e,"Демөөрчүлөнгөн"):"lo"==o?n(e,"ຜູ້ສະໜັບສະໜູນ"):"lt"==o?n(e,"Remiama"):"lv"==o?n(e,"Apmaksāta reklāma"):"mg"==o?n(e,"Misy Mpiantoka"):"ml"==o?n(e,"സ്പോൺസർ ചെയ്തത്"):"mn"==o?n(e,"Ивээн тэтгэсэн"):"mt"==o?n(e,"Sponsorjat"):"my"==o?(n(e,"ပံ့ပိုးထားသည်"),"0"==l&&n(e,"အခပေးကြော်ငြာ")):"or"==o?n(e,"ପ୍ରଯୋଜିତ"):"pa"==o?n(e,"ਸਰਪ੍ਰਸਤੀ ਪ੍ਰਾਪਤ"):"ps"==o?n(e,"تمويل شوي"):"ro"==o?n(e,"Sponsorizat"):"ru"==o||"uk"==o?n(e,"Реклама"):"rw"==o?n(e,"Icyamamaza ndasukirwaho"):"sc"==o?n(e,"Patronadu de"):"si"==o?n(e,"අනුග්රාහක"):"sk"==o?n(e,"Sponzorované"):"sn"==o?n(e,"Zvabhadharirwa"):"so"==o?n(e,"La maalgeliyey"):"sr"==o?n(e,"Спонзорисано"):"sw"==o?n(e,"Imedhaminiwa"):"sy"==o?n(e,"ܒܘܕܩܐ ܡܡܘܘܢܐ"):"sz"==o?n(e,"Szpōnzorowane"):"ta"==o?n(e,"விளம்பரம்"):"te"==o?n(e,"ప్రాయోజితం చేయబడింది"):"tg"==o?n(e,"Бо сарпарастӣ"):"th"==o?n(e,"ได้รับการสนับสนุน"):"tl"==o?n(e,"May Sponsor"):"tr"==o?n(e,"Sponsorlu"):"tt"==o?n(e,"Хәйрияче"):"tz"==o?n(e,"ⵉⴷⵍ"):"ur"==o?n(e,"سپانسرڈ"):"uz"==o?n(e,"Reklama"):"vi"==o?n(e,"Được tài trợ"):"zh-Hans"==o?n(e,"赞助内容"):"zh-Hant"==o&&n(e,"贊助"),0<h.length&&0<p.length&&0<d.length&&0<u.length)){for(cont=0;cont<h.length;cont++)0<h[cont].offsetHeight&&(cont=h.length,s=1);for(cont1=0;cont1<p.length;cont1++)0<p[cont1].offsetHeight&&(cont1=p.length,l=1);for(cont2=0;cont2<d.length;cont2++)0<d[cont2].offsetHeight&&(cont2=d.length,r=1);for(cont3=0;cont3<u.length;cont3++)0<u[cont3].offsetHeight&&(cont3=u.length,i=1);1==s&&1==l&&1==r&&1==i&&(0<m.length&&""!=(y=e.querySelectorAll("a[href]")[1].innerText)||(y=e.querySelectorAll("a[href]")[2].innerText),T+=1,console.log("--------"),console.log("Ad hidden from: "+y),console.log("Total ads hidden: "+T),console.log("--------"),e.style="display:none!important;")}})}),T=0;e.observe(document,{childList:!0,subtree:!0})}();': {
        uniqueId: "cb487be2d2edd22f1a9ce90cd6ffe9cf",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.cb487be2d2edd22f1a9ce90cd6ffe9cf !== e) {
                    !function() {
                        var e = new MutationObserver((function() {
                            var e = document.querySelectorAll("div[id^='mount_']");
                            (0 < e.length ? document.querySelectorAll('div[role="feed"] > div[data-pagelet^="FeedUnit"] > div[class]:not([style*="height"])') : document.querySelectorAll('[id^="substream"] > div:not(.hidden_elem) div[id^="hyperfeed_story_id"]')).forEach((function(t) {
                                function c(n, t) {
                                    for (0 < e.length ? "0" == (h = n.querySelectorAll('div[role="article"] span[dir="auto"] > a > span > span > span[data-content]')).length && (h = n.querySelectorAll('div[role="article"] span[dir="auto"] > a > span[aria-label]')) : h = n.querySelectorAll(".userContentWrapper h5 + div[data-testid] a [class] [class]"), 
                                    socheck = 0; socheck < h.length; socheck++) h[socheck].innerText.contains(t) && (d = [ "1" ], 
                                    p = [ "1" ], u = [ "1" ], i = r = l = 1, socheck = h.length);
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
                                            i = 1) : (p = [ "1" ], r = 1) : (d = [ "1" ], l = 1);
                                            0 == e.length && ((!(spancheck.innerText.contains(t) && 0 == spancheck.offsetTop || h[0].innerText.contains(t) && 0 == h[0].offsetTop) || spancheck.innerText.contains(c) && !h[0].innerText.contains(c) || spancheck.innerText.contains(o) && !h[0].innerText.contains(o) || spancheck.innerText.contains(a) && !h[0].innerText.contains(a)) && (!k.innerText.contains(t) || 0 != k.offsetTop || k.innerText.contains(c) || k.innerText.contains(o) || k.innerText.contains(a)) ? !spancheck.innerText.contains(c) || 0 != spancheck.offsetTop || spancheck.innerText.contains(t) || spancheck.innerText.contains(o) || spancheck.innerText.contains(a) ? !spancheck.innerText.contains(o) || 0 != spancheck.offsetTop || spancheck.innerText.contains(c) || spancheck.innerText.contains(t) || spancheck.innerText.contains(a) ? !spancheck.innerText.contains(a) || 0 != spancheck.offsetTop || spancheck.innerText.contains(c) || spancheck.innerText.contains(o) || spancheck.innerText.contains(t) || (u = [ "1" ], 
                                            i = 1) : (p = [ "1" ], r = 1) : (d = [ "1" ], l = 1) : s = 1);
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
                                var s = 0, l = 0, r = 0, i = 0, h = 0, d = 0, p = 0, u = 0, k = t.querySelectorAll("div[style='width: 100%'] > a[href*='oculus.com/quest'] > div"), f = document.querySelector("[lang]"), y = document.querySelectorAll("link[rel='preload'][href*='/l/']");
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
                                "0" == l && a(t, "P", "a", "c", "o")) : "bn" == f ? c(t, "সৌজন্যে") : "cb" == f ? c(t, "پاڵپشتیکراو") : "cx" == f ? a(t, "G", "i", "s", "n") : "cy" == f ? c(t, "Noddwyd") : "el" == f ? c(t, "Χορηγούμενη") : "eo" == f ? c(t, "Reklamo") : "es" == f ? a(t, "P", "u", "c", "d") : "eu" == f ? c(t, "Babestua") : "fa" == f ? c(t, "دارای پشتیبانی مالی") : "ff" == f ? c(t, "Yoɓanaama") : "fi" == f ? c(t, "Sponsoroitu") : "fo" == f ? c(t, "Stuðlað") : "fr" == f ? 0 < e.length ? y[0].href.contains("fr_FR") ? a(t, "S", "p", "s", "n") : a(t, "C", "o", "m", "n") : document.querySelector("body").className.includes("Locale_fr_FR") ? a(t, "S", "p", "s", "n") : a(t, "C", "o", "m", "n") : "ga" == f ? c(t, "Urraithe") : "gn" == f ? c(t, "Oñepatrosinapyre") : "gu" == f ? c(t, "પ્રાયોજિત") : "ha" == f ? c(t, "Daukar Nauyi") : "he" == f ? c(t, "ממומן") : "hr" == f ? c(t, "Plaćeni oglas") : "ht" == f ? c(t, "Peye") : "ne" == f || "mr" == f || "hi" == f ? c(t, "प्रायोजित") : "hu" == f ? a(t, "H", "i", "r", "d") : "hy" == f ? c(t, "Գովազդային") : "id" == f ? a(t, "B", "e", "p", "n") : "is" == f ? c(t, "Kostað") : "ja" == f ? c(t, "広告") : "ms" == f ? c(t, "Ditaja") : "jv" == f ? c(t, "Disponsori") : "ka" == f ? c(t, "რეკლამა") : "kk" == f ? c(t, "Демеушілік көрсеткен") : "km" == f ? c(t, "បានឧបត្ថម្ភ") : "kn" == f ? c(t, "ಪ್ರಾಯೋಜಿತ") : "ko" == f ? c(t, "Sponsored") : "ky" == f ? c(t, "Демөөрчүлөнгөн") : "lo" == f ? c(t, "ຜູ້ສະໜັບສະໜູນ") : "lt" == f ? c(t, "Remiama") : "lv" == f ? c(t, "Apmaksāta reklāma") : "mg" == f ? c(t, "Misy Mpiantoka") : "ml" == f ? c(t, "സ്പോൺസർ ചെയ്തത്") : "mn" == f ? c(t, "Ивээн тэтгэсэн") : "mt" == f ? c(t, "Sponsorjat") : "my" == f ? (c(t, "ပံ့ပိုးထားသည်"), 
                                "0" == l && c(t, "အခပေးကြော်ငြာ")) : "or" == f ? c(t, "ପ୍ରଯୋଜିତ") : "pa" == f ? c(t, "ਸਰਪ੍ਰਸਤੀ ਪ੍ਰਾਪਤ") : "ps" == f ? c(t, "تمويل شوي") : "ro" == f ? c(t, "Sponsorizat") : "ru" == f || "uk" == f ? c(t, "Реклама") : "rw" == f ? c(t, "Icyamamaza ndasukirwaho") : "sc" == f ? c(t, "Patronadu de") : "si" == f ? c(t, "අනුග්රාහක") : "sk" == f ? c(t, "Sponzorované") : "sn" == f ? c(t, "Zvabhadharirwa") : "so" == f ? c(t, "La maalgeliyey") : "sr" == f ? c(t, "Спонзорисано") : "sw" == f ? c(t, "Imedhaminiwa") : "sy" == f ? c(t, "ܒܘܕܩܐ ܡܡܘܘܢܐ") : "sz" == f ? c(t, "Szpōnzorowane") : "ta" == f ? c(t, "விளம்பரம்") : "te" == f ? c(t, "ప్రాయోజితం చేయబడింది") : "tg" == f ? c(t, "Бо сарпарастӣ") : "th" == f ? c(t, "ได้รับการสนับสนุน") : "tl" == f ? c(t, "May Sponsor") : "tr" == f ? c(t, "Sponsorlu") : "tt" == f ? c(t, "Хәйрияче") : "tz" == f ? c(t, "ⵉⴷⵍ") : "ur" == f ? c(t, "سپانسرڈ") : "uz" == f ? c(t, "Reklama") : "vi" == f ? c(t, "Được tài trợ") : "zh-Hans" == f ? c(t, "赞助内容") : "zh-Hant" == f && c(t, "贊助"), 
                                0 < h.length && 0 < d.length && 0 < p.length && 0 < u.length)) {
                                    for (cont = 0; cont < h.length; cont++) 0 < h[cont].offsetHeight && (cont = h.length, 
                                    s = 1);
                                    for (cont1 = 0; cont1 < d.length; cont1++) 0 < d[cont1].offsetHeight && (cont1 = d.length, 
                                    l = 1);
                                    for (cont2 = 0; cont2 < p.length; cont2++) 0 < p[cont2].offsetHeight && (cont2 = p.length, 
                                    r = 1);
                                    for (cont3 = 0; cont3 < u.length; cont3++) 0 < u[cont3].offsetHeight && (cont3 = u.length, 
                                    i = 1);
                                    1 == s && 1 == l && 1 == r && 1 == i && (0 < e.length && "" != (g = t.querySelectorAll("a[href]")[1].innerText) || (g = t.querySelectorAll("a[href]")[2].innerText), 
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "cb487be2d2edd22f1a9ce90cd6ffe9cf" due to: ' + e);
            }
        }
    },
    '!function(){var b=0,d=[];new MutationObserver(function(){document.querySelectorAll("div[data-pagelet^=\\"FeedUnit\\"]:not([style*=\\"display: none\\"]), div[role=\\"feed\\"] > div:not([style*=\\"display: none\\"]), div[role=\\"feed\\"] > span:not([style*=\\"display: none\\"]), #ssrb_feed_start + div > div[class]:not([style*=\\"display: none\\"]), #ssrb_feed_start + div span > h3 ~ div[class]:not([style*=\\"display: none\\"]), #ssrb_feed_start + div h3~ div[class]:not([style*=\\"display: none\\"]), #ssrb_feed_start + div h3 ~ div > div[class]:not([style*=\\"display: none\\"]), div[role=\\"main\\"] div[class] > #ssrb_feed_start ~ div > h3 ~ div > div[class]:not([style*=\\"display: none\\"]), div[role=\\"main\\"] div > h3 ~ div > div[class]:not([style*=\\"display: none\\"]), #ssrb_feed_start + div > div > div[class]:not([style*=\\"display: none\\"]), div[role=\\"main\\"] div > h2 ~ div > div[class]:not([style*=\\"display: none\\"]), #ssrb_feed_start + div > div > div[class] > div:not([class], [id]) div:not([class], [id]):not([style*=\\"display: none\\"]), div[role=\\"main\\"] div > h3 ~ div > div[class] > div:not([class], [id]) div:not([class], [id], [dir], [data-0], [style]), div[role=\\"main\\"] div > h2 ~ div > div[class] > div > div:not([style*=\\"display: none\\"]), div[role=\\"main\\"] h3[dir=\\"auto\\"] + div > div[class]:not([style*=\\"display: none\\"]), div[role=\\"main\\"] div > h2 ~ div > div[class] > div > div:not([style*=\\"display: none\\"]) > div:not([style*=\\"display: none\\"]), div[role=\\"main\\"] div > h2 ~ div > div > div > div:not([style*=\\"display: none\\"]) > div:not([style*=\\"display: none\\"]), div[role=\\"main\\"] div > h3 ~ div > div > div > div:not([style*=\\"display: none\\"]) > div:not([style*=\\"display: none\\"])").forEach(function(e){Object.keys(e).forEach(function(a){if(a.includes?.("__reactEvents")||a.includes?.("__reactProps")){a=e[a];try{if(a.children?.props?.category?.includes("SPONSORED")||a.children?.props?.children?.props?.category?.includes("SPONSORED")||a.children?.props?.feedEdge?.category?.includes("SPONSORED")||a.children?.props?.children?.props?.feedEdge?.category?.includes("SPONSORED")||a.children?.props?.children?.props?.children?.props?.feedEdge?.category?.includes("SPONSORED")||a.children?.props?.children?.props?.children?.props?.children?.props?.feedEdge?.category?.includes("SPONSORED")||a.children?.props?.children?.props?.children?.props?.children?.props?.feedEdge?.feed_story_category?.includes("SPONSORED")||a.children?.props?.children?.props?.children?.props?.children?.props?.feedEdge?.story_category?.includes("SPONSORED")||a.children?.props?.children?.props?.children?.props?.children?.props?.feedEdge?.story_cat?.includes("SPONSORED")||a.children?.props?.children?.props?.children?.props?.children?.props?.feedEdge?.category_sensitive?.cat?.includes("SPONSORED")||a.children?.props?.children?.props?.children?.props?.children?.props?.feedEdge?.node?.sponsored_data?.brs_filter_setting||a.children?.props?.children?.props?.children?.props?.children?.props?.feedUnit?.lbl_sp_data?.ad_id||a.children?.props?.children?.props?.minGapType?.includes("SPONSORED")){b++,e.style="display: none !important;";var f=e.querySelector("a[href][aria-label]:not([aria-hidden])");f&&(d.push(["Ad blocked based on property ["+b+"] -> "+f.ariaLabel]),console.table(d))}}catch(a){}}})})}).observe(document,{childList:!0,subtree:!0})}();': {
        uniqueId: "16297150c7ce63b45d348aadf00491c2",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["16297150c7ce63b45d348aadf00491c2"] !== e) {
                    !function() {
                        var e = 0, d = [];
                        new MutationObserver((function() {
                            document.querySelectorAll('div[data-pagelet^="FeedUnit"]:not([style*="display: none"]), div[role="feed"] > div:not([style*="display: none"]), div[role="feed"] > span:not([style*="display: none"]), #ssrb_feed_start + div > div[class]:not([style*="display: none"]), #ssrb_feed_start + div span > h3 ~ div[class]:not([style*="display: none"]), #ssrb_feed_start + div h3~ div[class]:not([style*="display: none"]), #ssrb_feed_start + div h3 ~ div > div[class]:not([style*="display: none"]), div[role="main"] div[class] > #ssrb_feed_start ~ div > h3 ~ div > div[class]:not([style*="display: none"]), div[role="main"] div > h3 ~ div > div[class]:not([style*="display: none"]), #ssrb_feed_start + div > div > div[class]:not([style*="display: none"]), div[role="main"] div > h2 ~ div > div[class]:not([style*="display: none"]), #ssrb_feed_start + div > div > div[class] > div:not([class], [id]) div:not([class], [id]):not([style*="display: none"]), div[role="main"] div > h3 ~ div > div[class] > div:not([class], [id]) div:not([class], [id], [dir], [data-0], [style]), div[role="main"] div > h2 ~ div > div[class] > div > div:not([style*="display: none"]), div[role="main"] h3[dir="auto"] + div > div[class]:not([style*="display: none"]), div[role="main"] div > h2 ~ div > div[class] > div > div:not([style*="display: none"]) > div:not([style*="display: none"]), div[role="main"] div > h2 ~ div > div > div > div:not([style*="display: none"]) > div:not([style*="display: none"]), div[role="main"] div > h3 ~ div > div > div > div:not([style*="display: none"]) > div:not([style*="display: none"])').forEach((function(i) {
                                Object.keys(i).forEach((function(s) {
                                    if (s.includes?.("__reactEvents") || s.includes?.("__reactProps")) {
                                        s = i[s];
                                        try {
                                            if (s.children?.props?.category?.includes("SPONSORED") || s.children?.props?.children?.props?.category?.includes("SPONSORED") || s.children?.props?.feedEdge?.category?.includes("SPONSORED") || s.children?.props?.children?.props?.feedEdge?.category?.includes("SPONSORED") || s.children?.props?.children?.props?.children?.props?.feedEdge?.category?.includes("SPONSORED") || s.children?.props?.children?.props?.children?.props?.children?.props?.feedEdge?.category?.includes("SPONSORED") || s.children?.props?.children?.props?.children?.props?.children?.props?.feedEdge?.feed_story_category?.includes("SPONSORED") || s.children?.props?.children?.props?.children?.props?.children?.props?.feedEdge?.story_category?.includes("SPONSORED") || s.children?.props?.children?.props?.children?.props?.children?.props?.feedEdge?.story_cat?.includes("SPONSORED") || s.children?.props?.children?.props?.children?.props?.children?.props?.feedEdge?.category_sensitive?.cat?.includes("SPONSORED") || s.children?.props?.children?.props?.children?.props?.children?.props?.feedEdge?.node?.sponsored_data?.brs_filter_setting || s.children?.props?.children?.props?.children?.props?.children?.props?.feedUnit?.lbl_sp_data?.ad_id || s.children?.props?.children?.props?.minGapType?.includes("SPONSORED")) {
                                                e++, i.style = "display: none !important;";
                                                var n = i.querySelector("a[href][aria-label]:not([aria-hidden])");
                                                n && (d.push([ "Ad blocked based on property [" + e + "] -> " + n.ariaLabel ]), 
                                                console.table(d));
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
                    Object.defineProperty(Window.prototype.toString, "16297150c7ce63b45d348aadf00491c2", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "16297150c7ce63b45d348aadf00491c2" due to: ' + e);
            }
        }
    },
    '!function(){(new MutationObserver(function(){window.location.href.includes("/watch")&&document.querySelectorAll(\'#watch_feed div:not([class]):not([id]) > div[class*=" "]:not([style*="display: none !important"]) div[class^="_"] > div[class*=" "]\').forEach(function(b){Object.keys(b).forEach(function(a){if(a.includes("__reactFiber")){a=b[a];try{var c,d,e,f;if(null==(c=a)?0:null==(d=c["return"])?0:null==(e=d.memoizedProps)?0:null==(f=e.story)?0:f.sponsored_data){var g=b.closest(\'#watch_feed div[class*=" "] div:not([class]):not([id]) > div[class*=" "]:not([style*="display: none !important"])\');g.style="display: none !important;"}}catch(h){}}})})})).observe(document,{childList:!0,subtree:!0,attributeFilter:["style"]})}();': {
        uniqueId: "21d8e78f9157f1f1188b26cd68182732",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["21d8e78f9157f1f1188b26cd68182732"] !== e) {
                    new MutationObserver((function() {
                        window.location.href.includes("/watch") && document.querySelectorAll('#watch_feed div:not([class]):not([id]) > div[class*=" "]:not([style*="display: none !important"]) div[class^="_"] > div[class*=" "]').forEach((function(e) {
                            Object.keys(e).forEach((function(t) {
                                if (t.includes("__reactFiber")) {
                                    t = e[t];
                                    try {
                                        var o, n, i, r;
                                        null != (o = t) && null != (n = o.return) && null != (i = n.memoizedProps) && null != (r = i.story) && r.sponsored_data && (e.closest('#watch_feed div[class*=" "] div:not([class]):not([id]) > div[class*=" "]:not([style*="display: none !important"])').style = "display: none !important;");
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "21d8e78f9157f1f1188b26cd68182732" due to: ' + e);
            }
        }
    },
    '!function(){if(location.href.includes("marketplace/item")){var b=0,d=[];new MutationObserver(function(){document.querySelectorAll("div[aria-label=\'Marketplace listing viewer\'] > div div + div + span:not([style*=\'display: none\']), #ssrb_feed_start + div > div div + div + span:not([style*=\'display: none\'])").forEach(function(e){Object.keys(e).forEach(function(a){if(a.includes("__reactEvents")||a.includes("__reactProps")){a=e[a];try{if(a.children?.props?.children?.props?.adId){b++,e.style="display: none !important;";var f=e.querySelector("a[href][aria-label]:not([aria-hidden])");f&&(d.push(["Ad blocked based on property ["+b+"] -> "+f.ariaLabel]),console.table(d))}}catch(a){}}})})}).observe(document,{childList:!0,subtree:!0})}}();': {
        uniqueId: "b5ee651ceb5b17d69e521c7d45d2dc1f",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.b5ee651ceb5b17d69e521c7d45d2dc1f !== e) {
                    !function() {
                        if (location.href.includes("marketplace/item")) {
                            var e = 0, t = [];
                            new MutationObserver((function() {
                                document.querySelectorAll("div[aria-label='Marketplace listing viewer'] > div div + div + span:not([style*='display: none']), #ssrb_feed_start + div > div div + div + span:not([style*='display: none'])").forEach((function(r) {
                                    Object.keys(r).forEach((function(i) {
                                        if (i.includes("__reactEvents") || i.includes("__reactProps")) {
                                            i = r[i];
                                            try {
                                                if (i.children?.props?.children?.props?.adId) {
                                                    e++, r.style = "display: none !important;";
                                                    var n = r.querySelector("a[href][aria-label]:not([aria-hidden])");
                                                    n && (t.push([ "Ad blocked based on property [" + e + "] -> " + n.ariaLabel ]), 
                                                    console.table(t));
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "b5ee651ceb5b17d69e521c7d45d2dc1f" due to: ' + e);
            }
        }
    },
    '!function(){var e=new MutationObserver(function(){document.querySelectorAll(\'[id^="substream"] > div:not(.hidden_elem) div[id^="hyperfeed_story_id"]\').forEach(function(e){function t(e,t){for(s=e.querySelectorAll(\'.userContentWrapper h5 + div[data-testid*="sub"] a [class] [class]\'),socheck=0;socheck<s.length;socheck++)s[socheck].innerText.contains(t)&&(c=["1"],d=["1"],i=["1"],r=l=a=1,socheck=s.length)}function o(e,t,o,n,a){s=e.querySelectorAll(\'.userContentWrapper h5 + div[data-testid*="sub"] a [data-content=\'+t+"]"),c=e.querySelectorAll(\'.userContentWrapper h5 + div[data-testid*="sub"] a [data-content=\'+o+"]"),d=e.querySelectorAll(\'.userContentWrapper h5 + div[data-testid*="sub"] a [data-content=\'+n+"]"),i=e.querySelectorAll(\'.userContentWrapper h5 + div[data-testid*="sub"] a [data-content=\'+a+"]"),0==s.length&&(s=e.querySelectorAll(\'.userContentWrapper h5 + div[data-testid*="label"] a [data-content=\'+t+"]"),c=e.querySelectorAll(\'.userContentWrapper h5 + div[data-testid*="label"] a [data-content=\'+o+"]"),d=e.querySelectorAll(\'.userContentWrapper h5 + div[data-testid*="label"] a [data-content=\'+n+"]"),i=e.querySelectorAll(\'.userContentWrapper h5 + div[data-testid*="label"] a [data-content=\'+a+"]"))}var n=0,a=0,l=0,r=0,s=0,c=0,d=0,i=0,u=e.querySelectorAll("div[style=\'width: 100%\'] > a[href*=\'oculus.com/quest\'] > div"),h=document.querySelector("[lang]").lang,g=e.querySelectorAll(\'a[ajaxify*="ad_id"] > span\'),p=e.querySelectorAll(\'a[href*="ads/about"]\');if("display: none !important;"!=e.getAttribute("style")&&!e.classList.contains("hidden_elem")){if(0<g.length||0<p.length){f+=1;var y=e.querySelectorAll("a[href]")[2].innerText;console.log("--------"),console.log("Ad hidden from: "+y),console.log("Total ads hidden: "+f),console.log("F length: "+g.length),console.log("H length: "+p.length),console.log("--------"),e.style="display:none!important;"}else if(0<u.length){f+=1;y="Facebook";console.log("--------"),console.log("Ad hidden from: "+y),console.log("Total ads hidden: "+f),console.log("Non-declared ad"),console.log("--------"),e.style="display:none!important;"}else"af"==h?t(e,"Geborg"):"de"==h||"nl"==h?o(e,"G","e","s","n"):"am"==h?t(e,"የተከፈለበት ማስታወቂያ"):"ar"==h?t(e,"مُموَّل"):"as"==h?t(e,"পৃষ্ঠপোষকতা কৰা"):"az"==h?t(e,"Sponsor dəstəkli"):"co"==h?t(e,"Spunsurizatu"):"bs"==h||"sl"==h||"cs"==h?o(e,"S","p","z","n"):"da"==h||"en"==h||"et"==h||"fy"==h||"it"==h||"ku"==h||"nb"==h||"nn"==h||"pl"==h||"sq"==h||"sv"==h||"zz"==h?document.querySelector("body").className.includes("Locale_en_UD")?t(e,"pəɹosuodS"):o(e,"S","p","s","n"):"be"==h?t(e,"Рэклама"):"bg"==h?t(e,"Спонсорирано"):"mk"==h?t(e,"Спонзорирано"):"br"==h?t(e,"Paeroniet"):"ca"==h?t(e,"Patrocinat"):"gl"==h||"pt"==h?t(e,"Patrocinado"):"bn"==h?t(e,"সৌজন্যে"):"cb"==h?t(e,"پاڵپشتیکراو"):"cx"==h?o(e,"G","i","s","n"):"cy"==h?t(e,"Noddwyd"):"el"==h?t(e,"Χορηγούμενη"):"eo"==h?t(e,"Reklamo"):"es"==h?o(e,"P","u","c","d"):"eu"==h?t(e,"Babestua"):"fa"==h?t(e,"دارای پشتیبانی مالی"):"ff"==h?t(e,"Yoɓanaama"):"fi"==h?t(e,"Sponsoroitu"):"fo"==h?t(e,"Stuðlað"):"fr"==h?document.querySelector("body").className.includes("Locale_fr_FR")?o(e,"S","p","s","n"):o(e,"C","o","m","n"):"ga"==h?t(e,"Urraithe"):"gn"==h?t(e,"Oñepatrosinapyre"):"gu"==h?t(e,"પ્રાયોજિત"):"ha"==h?t(e,"Daukar Nauyi"):"he"==h?t(e,"ממומן"):"hr"==h?t(e,"Plaćeni oglas"):"ht"==h?t(e,"Peye"):"ne"==h||"mr"==h||"hi"==h?t(e,"प्रायोजित"):"hu"==h?o(e,"H","i","r","d"):"hy"==h?t(e,"Գովազդային"):"id"==h?o(e,"B","e","p","n"):"is"==h?t(e,"Kostað"):"ja"==h?t(e,"広告"):"ms"==h?t(e,"Ditaja"):"jv"==h?t(e,"Disponsori"):"ka"==h?t(e,"რეკლამა"):"kk"==h?t(e,"Демеушілік көрсеткен"):"km"==h?t(e,"បានឧបត្ថម្ភ"):"kn"==h?t(e,"ಪ್ರಾಯೋಜಿತ"):"ko"==h?t(e,"Sponsored"):"ky"==h?t(e,"Демөөрчүлөнгөн"):"lo"==h?t(e,"ຜູ້ສະໜັບສະໜູນ"):"lt"==h?t(e,"Remiama"):"lv"==h?t(e,"Apmaksāta reklāma"):"mg"==h?t(e,"Misy Mpiantoka"):"ml"==h?t(e,"സ്പോൺസർ ചെയ്തത്"):"mn"==h?t(e,"Ивээн тэтгэсэн"):"mt"==h?t(e,"Sponsorjat"):"my"==h?t(e,"ပံ့ပိုးထားသည်"):"or"==h?t(e,"ପ୍ରଯୋଜିତ"):"pa"==h?t(e,"ਸਰਪ੍ਰਸਤੀ ਪ੍ਰਾਪਤ"):"ps"==h?t(e,"تمويل شوي"):"ro"==h?t(e,"Sponsorizat"):"ru"==h||"uk"==h?t(e,"Реклама"):"rw"==h?t(e,"Icyamamaza ndasukirwaho"):"sc"==h?t(e,"Patronadu de"):"si"==h?t(e,"අනුග්‍රාහක"):"sk"==h?t(e,"Sponzorované"):"sn"==h?t(e,"Zvabhadharirwa"):"so"==h?t(e,"La maalgeliyey"):"sr"==h?t(e,"Спонзорисано"):"sw"==h?t(e,"Imedhaminiwa"):"sy"==h?t(e,"ܒܘܕܩܐ ܡܡܘܘܢܐ"):"sz"==h?t(e,"Szpōnzorowane"):"ta"==h?t(e,"விளம்பரம்"):"te"==h?t(e,"ప్రాయోజితం చేయబడింది"):"tg"==h?t(e,"Бо сарпарастӣ"):"th"==h?t(e,"ได้รับการสนับสนุน"):"tl"==h?t(e,"May Sponsor"):"tr"==h?t(e,"Sponsorlu"):"tt"==h?t(e,"Хәйрияче"):"tz"==h?t(e,"ⵉⴷⵍ"):"ur"==h?t(e,"سپانسرڈ"):"uz"==h?t(e,"Reklama"):"vi"==h?t(e,"Được tài trợ"):"zh-Hans"==h?t(e,"赞助内容"):"zh-Hant"==h&&t(e,"贊助");if(0<s.length&&0<c.length&&0<d.length&&0<i.length){for(cont=0;cont<s.length;cont++)0<s[cont].offsetHeight&&(cont=s.length,n=1);for(cont1=0;cont1<c.length;cont1++)0<c[cont1].offsetHeight&&(cont1=c.length,a=1);for(cont2=0;cont2<d.length;cont2++)0<d[cont2].offsetHeight&&(cont2=d.length,l=1);for(cont3=0;cont3<i.length;cont3++)0<i[cont3].offsetHeight&&(cont3=i.length,r=1);if(1==n&&1==a&&1==l&&1==r){y=e.querySelectorAll("a[href]")[2].innerText;f+=1,console.log("--------"),console.log("Ad hidden from: "+y),console.log("Total ads hidden: "+f),console.log("--------"),e.style="display:none!important;"}}}})}),f=0;e.observe(document,{childList:!0,subtree:!0,characterData:!0,attributes:!0})}();': {
        uniqueId: "c20e5794d5ff5adb72bad3179e0fd5f5",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.c20e5794d5ff5adb72bad3179e0fd5f5 !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "c20e5794d5ff5adb72bad3179e0fd5f5" due to: ' + e);
            }
        }
    },
    '!function(){var e,o;0<window.location.href.indexOf("marketplace")&&(e=new MutationObserver(function(){document.querySelectorAll(\'div[role="main"] div[class][style^="max-width:"] div[class][style^="max-width:"]\').forEach(function(e){var l,t=e.querySelectorAll(\'a[href*="ads/about"]\');"display: none !important;"==e.getAttribute("style")||e.classList.contains("hidden_elem")||0<t.length&&(o+=1,""==(l=e.querySelectorAll("a[href]")[0].innerText)&&(l=e.querySelectorAll("a[href]")[1].innerText),""==l&&(l=e.querySelectorAll("a[href]")[0].querySelectorAll("a[aria-label]")[0]?.getAttribute("aria-label")),console.log("--------"),console.log("Ad hidden from: "+l),console.log("Total ads hidden: "+o),console.log("H length: "+t.length),console.log("--------"),e.style="display:none!important;")})}),o=0,e.observe(document,{childList:!0,subtree:!0}))}();': {
        uniqueId: "e6189b04febc53c553beba1616cdd078",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.e6189b04febc53c553beba1616cdd078 !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "e6189b04febc53c553beba1616cdd078" due to: ' + e);
            }
        }
    },
    '!function(){new MutationObserver(function(){document.querySelectorAll("div[role=\\"main\\"] div[class][style^=\\"max-width:\\"] div[class][style*=\\"max-width:\\"]:not([style*=\\"display: none\\"])").forEach(function(c){Object.keys(c).forEach(function(a){if(a.includes("__reactEvents")||a.includes("__reactProps")){a=c[a];try{a.children?.props?.adSurface?.startsWith("Marketplace")&&(c.style="display: none !important;")}catch(a){}}})})}).observe(document,{childList:!0,subtree:!0})}();': {
        uniqueId: "9201edecacad19e52ef0fb416ec8c902",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["9201edecacad19e52ef0fb416ec8c902"] !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "9201edecacad19e52ef0fb416ec8c902" due to: ' + e);
            }
        }
    },
    '!function(){if(window.location.href.includes("/marketplace/")){new MutationObserver(function(){document.querySelectorAll(\'div[data-testid="marketplace_home_feed"] div[class][data-testid^="MarketplaceUpsell-"] > div > div\').forEach(function(e){var t=e.outerHTML;t&&void 0!==t&&!0===t.includes("/ads/about/")&&(e.style="display:none!important;")})}).observe(document,{childList:!0,subtree:!0})}}();': {
        uniqueId: "53a0bb610abe908070c9b157e3ec2214",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["53a0bb610abe908070c9b157e3ec2214"] !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "53a0bb610abe908070c9b157e3ec2214" due to: ' + e);
            }
        }
    },
    "(function(){var c=document.addEventListener;document.addEventListener=function(a,b,d,e){\"click\"!=a&&-1==b.toString().indexOf('about:blank')&&c(a,b,d,e)}.bind(document);})();": {
        uniqueId: "b178c9ef485593de3d7ea5826bcd32c2",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.b178c9ef485593de3d7ea5826bcd32c2 !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "b178c9ef485593de3d7ea5826bcd32c2" due to: ' + e);
            }
        }
    },
    "(function(){var b=window.setTimeout;window.setTimeout=function(a,c){if(!/Object\\[/.test(a.toString()))return b(a,c)};})();": {
        uniqueId: "3b230fa3fd4e2e2f5fa5fd1889bef31f",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["3b230fa3fd4e2e2f5fa5fd1889bef31f"] !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "3b230fa3fd4e2e2f5fa5fd1889bef31f" due to: ' + e);
            }
        }
    },
    '(function(){Object.defineProperty(window,"open",{writable:!1,enumerable:!1,configurable:!1,value:window.open})})();': {
        uniqueId: "6ad868fcfeb6310fe49001d70d33c6cc",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["6ad868fcfeb6310fe49001d70d33c6cc"] !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "6ad868fcfeb6310fe49001d70d33c6cc" due to: ' + e);
            }
        }
    },
    "Object.defineProperty(window, 'sas_manager', { get: function() { return { noad: function() {} }; }, set: function() {} });": {
        uniqueId: "28fca7a5881cbf189a14d7cdf5e6b931",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["28fca7a5881cbf189a14d7cdf5e6b931"] !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "28fca7a5881cbf189a14d7cdf5e6b931" due to: ' + e);
            }
        }
    },
    "(function(){var b=window.setTimeout;window.setTimeout=function(a,c){if(!/=setTimeout\\(/.test(a.toString()))return b(a,c)};})();": {
        uniqueId: "0ced54e08131ded625d8ea5a23188494",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["0ced54e08131ded625d8ea5a23188494"] !== e) {
                    !function() {
                        var e = window.setTimeout;
                        window.setTimeout = function(t, o) {
                            if (!/=setTimeout\(/.test(t.toString())) return e(t, o);
                        };
                    }();
                    Object.defineProperty(Window.prototype.toString, "0ced54e08131ded625d8ea5a23188494", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "0ced54e08131ded625d8ea5a23188494" due to: ' + e);
            }
        }
    },
    "(function(){var c=document.addEventListener;document.addEventListener=function(a,b,d,e){\"click\"!=a&&-1==b.toString().indexOf('.hi()')&&c(a,b,d,e)}.bind(document);})();": {
        uniqueId: "fe0404e371f4ffecdbfb5cb284c5f6a9",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.fe0404e371f4ffecdbfb5cb284c5f6a9 !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "fe0404e371f4ffecdbfb5cb284c5f6a9" due to: ' + e);
            }
        }
    },
    '(function(){var c=document.addEventListener;document.addEventListener=function(a,b,d,e){"click"!=a&&-1==b.toString().indexOf(\'"dtnoppu"\')&&c(a,b,d,e)}.bind(document);})();': {
        uniqueId: "151b026ff6ad3e430ea55419ab72ee6d",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["151b026ff6ad3e430ea55419ab72ee6d"] !== e) {
                    !function() {
                        var e = document.addEventListener;
                        document.addEventListener = function(t, n, o, d) {
                            "click" != t && -1 == n.toString().indexOf('"dtnoppu"') && e(t, n, o, d);
                        }.bind(document);
                    }();
                    Object.defineProperty(Window.prototype.toString, "151b026ff6ad3e430ea55419ab72ee6d", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "151b026ff6ad3e430ea55419ab72ee6d" due to: ' + e);
            }
        }
    },
    'window["pop_clicked"] = 1;': {
        uniqueId: "7388e0f8018a3f9b99906510f5d32edd",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["7388e0f8018a3f9b99906510f5d32edd"] !== e) {
                    window.pop_clicked = 1;
                    Object.defineProperty(Window.prototype.toString, "7388e0f8018a3f9b99906510f5d32edd", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "7388e0f8018a3f9b99906510f5d32edd" due to: ' + e);
            }
        }
    },
    "(function(){var c=document.addEventListener;document.addEventListener=function(a,b,d,e){\"click\"!=a&&-1==b.toString().indexOf('trigerred')&&c(a,b,d,e)}.bind(document);})();": {
        uniqueId: "a7165e98cefa8ce0f55b8614d1d6e6f5",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.a7165e98cefa8ce0f55b8614d1d6e6f5 !== e) {
                    !function() {
                        var e = document.addEventListener;
                        document.addEventListener = function(t, n, r, o) {
                            "click" != t && -1 == n.toString().indexOf("trigerred") && e(t, n, r, o);
                        }.bind(document);
                    }();
                    Object.defineProperty(Window.prototype.toString, "a7165e98cefa8ce0f55b8614d1d6e6f5", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "a7165e98cefa8ce0f55b8614d1d6e6f5" due to: ' + e);
            }
        }
    },
    "document.addEventListener('DOMContentLoaded', function() { if (window.location.href.indexOf(\"hpinterstitialnew.html\") != -1) { window.setCookie1('sitecapture_interstitial', 1, 1); window.location.href = \"http://www.ndtv.com/\"; } })": {
        uniqueId: "9c145fd1fa9c4877477d33378243415b",
        func: () => {
            try {
                const t = "done";
                if (Window.prototype.toString["9c145fd1fa9c4877477d33378243415b"] !== t) {
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
                }
            } catch (t) {
                console.error('Error executing AG js rule with uniqueId "9c145fd1fa9c4877477d33378243415b" due to: ' + t);
            }
        }
    },
    "window.exo99HL3903jjdxtrnLoad = true;": {
        uniqueId: "ba561ed0ab3a43ea4e1d5efa8fb5a465",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.ba561ed0ab3a43ea4e1d5efa8fb5a465 !== e) {
                    window.exo99HL3903jjdxtrnLoad = !0;
                    Object.defineProperty(Window.prototype.toString, "ba561ed0ab3a43ea4e1d5efa8fb5a465", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "ba561ed0ab3a43ea4e1d5efa8fb5a465" due to: ' + e);
            }
        }
    },
    '(()=>{document.addEventListener("DOMContentLoaded",(()=>{ prerollskip(); setTimeout(function() { prerollskip(); }, 100); setTimeout(function() { prerollskip(); }, 300); }));})();': {
        uniqueId: "bea12eedfd9b904b94659dc26fd1e724",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.bea12eedfd9b904b94659dc26fd1e724 !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "bea12eedfd9b904b94659dc26fd1e724" due to: ' + e);
            }
        }
    },
    "!function(a,b){b=new MutationObserver(function(){a.classList.contains('idle')&&a.classList.remove('idle')}),b.observe(a,{attributes:!0,attributeFilter:['class']})}(document.documentElement);": {
        uniqueId: "58ce3922fa2965f0d4a1f9e3d1857281",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["58ce3922fa2965f0d4a1f9e3d1857281"] !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "58ce3922fa2965f0d4a1f9e3d1857281" due to: ' + e);
            }
        }
    },
    "window.canRunAds = !0;": {
        uniqueId: "34f856bab5f3c1916f563203a5ea7281",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["34f856bab5f3c1916f563203a5ea7281"] !== e) {
                    window.canRunAds = !0;
                    Object.defineProperty(Window.prototype.toString, "34f856bab5f3c1916f563203a5ea7281", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "34f856bab5f3c1916f563203a5ea7281" due to: ' + e);
            }
        }
    },
    "window.myatu_bgm = 0;": {
        uniqueId: "cdba7f77c6423f0c201c738bf909c4e8",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.cdba7f77c6423f0c201c738bf909c4e8 !== e) {
                    window.myatu_bgm = 0;
                    Object.defineProperty(Window.prototype.toString, "cdba7f77c6423f0c201c738bf909c4e8", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "cdba7f77c6423f0c201c738bf909c4e8" due to: ' + e);
            }
        }
    },
    "window.runad = function() {};": {
        uniqueId: "958f02264ba3a90c77c6ba0c98ad72ce",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["958f02264ba3a90c77c6ba0c98ad72ce"] !== e) {
                    window.runad = function() {};
                    Object.defineProperty(Window.prototype.toString, "958f02264ba3a90c77c6ba0c98ad72ce", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "958f02264ba3a90c77c6ba0c98ad72ce" due to: ' + e);
            }
        }
    },
    "setTimeout(function() { window.show_popup=false; window.download_inited = true; }, 300);": {
        uniqueId: "dc40c845363864583b847cd52bfc4bd3",
        func: () => {
            try {
                const o = "done";
                if (Window.prototype.toString.dc40c845363864583b847cd52bfc4bd3 !== o) {
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
                }
            } catch (o) {
                console.error('Error executing AG js rule with uniqueId "dc40c845363864583b847cd52bfc4bd3" due to: ' + o);
            }
        }
    },
    "function setOverlayHTML() {};": {
        uniqueId: "cc37d89d454cab3a16143f6e2ea4a4f3",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.cc37d89d454cab3a16143f6e2ea4a4f3 !== e) {
                    function setOverlayHTML() {}
                    Object.defineProperty(Window.prototype.toString, "cc37d89d454cab3a16143f6e2ea4a4f3", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (t) {
                console.error('Error executing AG js rule with uniqueId "cc37d89d454cab3a16143f6e2ea4a4f3" due to: ' + t);
            }
        }
    },
    "function setOverlayHTML_new() {};": {
        uniqueId: "085c413105051fb148c3d7a6bf82b5c3",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["085c413105051fb148c3d7a6bf82b5c3"] !== e) {
                    function setOverlayHTML_new() {}
                    Object.defineProperty(Window.prototype.toString, "085c413105051fb148c3d7a6bf82b5c3", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (t) {
                console.error('Error executing AG js rule with uniqueId "085c413105051fb148c3d7a6bf82b5c3" due to: ' + t);
            }
        }
    },
    "setTimeout(removeOverlayHTML, 2000);": {
        uniqueId: "b94a9a08e8bfdbb7535bd54ba79a2610",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.b94a9a08e8bfdbb7535bd54ba79a2610 !== e) {
                    setTimeout(removeOverlayHTML, 2e3);
                    Object.defineProperty(Window.prototype.toString, "b94a9a08e8bfdbb7535bd54ba79a2610", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "b94a9a08e8bfdbb7535bd54ba79a2610" due to: ' + e);
            }
        }
    },
    '(()=>{const e="loader.min.js",t={includes:String.prototype.includes,filter:Array.prototype.filter},l=()=>(new Error).stack,n={construct:(n,o,r)=>{const c=l();return t.includes.call(c,e)&&o[0]&&t.includes.call(o[0],"adshield")&&(o[0]=["(function(){})();"]),Reflect.construct(n,o,r)}};window.Blob=new Proxy(window.Blob,n);const o={apply:(n,o,r)=>{const c=l();return t.includes.call(c,e)&&r[0]&&t.includes.call(r[0],"new Error")&&(r[0]=()=>{}),Reflect.apply(n,o,r)}};window.setTimeout=new Proxy(window.setTimeout,o);const r={apply:(n,o,r)=>{const c=l();return t.includes.call(c,e)&&r[0]&&o?.includes?.("setTimeout")&&(o=t.filter.call(o,(e=>!t.includes.call(e,"setTimeout")))),Reflect.apply(n,o,r)}};window.Array.prototype.filter=new Proxy(window.Array.prototype.filter,r)})();': {
        uniqueId: "10c10bf4c1c0b9946b322ae5e709306d",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["10c10bf4c1c0b9946b322ae5e709306d"] !== e) {
                    (() => {
                        const e = "loader.min.js", t = {
                            includes: String.prototype.includes,
                            filter: Array.prototype.filter
                        }, o = () => (new Error).stack, r = {
                            construct: (r, c, n) => {
                                const l = o();
                                return t.includes.call(l, e) && c[0] && t.includes.call(c[0], "adshield") && (c[0] = [ "(function(){})();" ]), 
                                Reflect.construct(r, c, n);
                            }
                        };
                        window.Blob = new Proxy(window.Blob, r);
                        const c = {
                            apply: (r, c, n) => {
                                const l = o();
                                return t.includes.call(l, e) && n[0] && t.includes.call(n[0], "new Error") && (n[0] = () => {}), 
                                Reflect.apply(r, c, n);
                            }
                        };
                        window.setTimeout = new Proxy(window.setTimeout, c);
                        const n = {
                            apply: (r, c, n) => {
                                const l = o();
                                return t.includes.call(l, e) && n[0] && c?.includes?.("setTimeout") && (c = t.filter.call(c, (e => !t.includes.call(e, "setTimeout")))), 
                                Reflect.apply(r, c, n);
                            }
                        };
                        window.Array.prototype.filter = new Proxy(window.Array.prototype.filter, n);
                    })();
                    Object.defineProperty(Window.prototype.toString, "10c10bf4c1c0b9946b322ae5e709306d", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "10c10bf4c1c0b9946b322ae5e709306d" due to: ' + e);
            }
        }
    },
    '(()=>{const e={apply:(e,l,o)=>"link"===o[0]||"style"===o[0]?[]:Reflect.apply(e,l,o)};window.document.querySelectorAll=new Proxy(window.document.querySelectorAll,e)})();': {
        uniqueId: "5662f0dae824e1b38f13e27f256c2066",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["5662f0dae824e1b38f13e27f256c2066"] !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "5662f0dae824e1b38f13e27f256c2066" due to: ' + e);
            }
        }
    },
    '(()=>{const t={apply:(t,e,n)=>{const o=Reflect.apply(t,e,n);try{o instanceof HTMLIFrameElement&&"about:blank"===o.src&&o.contentWindow&&(o.contentWindow.fetch=window.fetch)}catch(t){}return o}};Node.prototype.appendChild=new Proxy(Node.prototype.appendChild,t)})();': {
        uniqueId: "3edea1aee9b3bb859f95e08c6a1229c1",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["3edea1aee9b3bb859f95e08c6a1229c1"] !== e) {
                    (() => {
                        const e = {
                            apply: (e, t, o) => {
                                const n = Reflect.apply(e, t, o);
                                try {
                                    n instanceof HTMLIFrameElement && "about:blank" === n.src && n.contentWindow && (n.contentWindow.fetch = window.fetch);
                                } catch (e) {}
                                return n;
                            }
                        };
                        Node.prototype.appendChild = new Proxy(Node.prototype.appendChild, e);
                    })();
                    Object.defineProperty(Window.prototype.toString, "3edea1aee9b3bb859f95e08c6a1229c1", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "3edea1aee9b3bb859f95e08c6a1229c1" due to: ' + e);
            }
        }
    },
    '(()=>{let t=document.location.href,e=[],n=[],o="",r=!1;const i=Array.prototype.push,a={apply:(t,o,a)=>(window.yt?.config_?.EXPERIMENT_FLAGS?.html5_enable_ssap_entity_id&&a[0]&&a[0]!==window&&"number"==typeof a[0].start&&a[0].end&&"ssap"===a[0].namespace&&a[0].id&&(r||0!==a[0]?.start||n.includes(a[0].id)||(e.length=0,n.length=0,r=!0,i.call(e,a[0]),i.call(n,a[0].id)),r&&0!==a[0]?.start&&!n.includes(a[0].id)&&(i.call(e,a[0]),i.call(n,a[0].id))),Reflect.apply(t,o,a))};window.Array.prototype.push=new Proxy(window.Array.prototype.push,a),document.addEventListener("DOMContentLoaded",(function(){if(!window.yt?.config_?.EXPERIMENT_FLAGS?.html5_enable_ssap_entity_id)return;const i=()=>{const t=document.querySelector("video");if(t&&e.length){const i=Math.round(t.duration),a=Math.round(e.at(-1).end/1e3),c=n.join(",");if(!1===t.loop&&o!==c&&i&&i===a){const n=e.at(-1).start/1e3;t.currentTime<n&&(t.currentTime=n,r=!1,o=c)}else if(!0===t.loop&&i&&i===a){const n=e.at(-1).start/1e3;t.currentTime<n&&(t.currentTime=n,r=!1,o=c)}}};i();new MutationObserver((()=>{t!==document.location.href&&(t=document.location.href,e.length=0,n.length=0,r=!1),i()})).observe(document,{childList:!0,subtree:!0})}))})();': {
        uniqueId: "ae4fa77cc5169989696ccbb4288099b4",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.ae4fa77cc5169989696ccbb4288099b4 !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "ae4fa77cc5169989696ccbb4288099b4" due to: ' + e);
            }
        }
    },
    '(()=>{window.JSON.parse=new Proxy(JSON.parse,{apply(r,e,t){const n=Reflect.apply(r,e,t);if(!location.pathname.startsWith("/shorts/"))return n;const a=n?.entries;return a&&Array.isArray(a)&&(n.entries=n.entries.filter((r=>{if(!r?.command?.reelWatchEndpoint?.adClientParams?.isAd)return r}))),n}});})();': {
        uniqueId: "f4df2111ba88e1c013b85786c3efab38",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.f4df2111ba88e1c013b85786c3efab38 !== e) {
                    window.JSON.parse = new Proxy(JSON.parse, {
                        apply(e, r, t) {
                            const n = Reflect.apply(e, r, t);
                            if (!location.pathname.startsWith("/shorts/")) return n;
                            const a = n?.entries;
                            return a && Array.isArray(a) && (n.entries = n.entries.filter((e => {
                                if (!e?.command?.reelWatchEndpoint?.adClientParams?.isAd) return e;
                            }))), n;
                        }
                    });
                    Object.defineProperty(Window.prototype.toString, "f4df2111ba88e1c013b85786c3efab38", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "f4df2111ba88e1c013b85786c3efab38" due to: ' + e);
            }
        }
    },
    '(()=>{document.addEventListener("DOMContentLoaded",(()=>{document.querySelectorAll(\'a[href^="https://af.gog.com/game/"]\').forEach((t=>{const e=t.getAttribute("href").replace("https://af.gog.com/","https://www.gog.com/");t.setAttribute("href",e)}))}));})();': {
        uniqueId: "639105ecfaab3d5ad7901b589aedc339",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["639105ecfaab3d5ad7901b589aedc339"] !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "639105ecfaab3d5ad7901b589aedc339" due to: ' + e);
            }
        }
    },
    'window.addEventListener("load",(()=>{window.stop()}));': {
        uniqueId: "30a2cb89c6bbab38b94dced993fe90d2",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["30a2cb89c6bbab38b94dced993fe90d2"] !== e) {
                    window.addEventListener("load", (() => {
                        window.stop();
                    }));
                    Object.defineProperty(Window.prototype.toString, "30a2cb89c6bbab38b94dced993fe90d2", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "30a2cb89c6bbab38b94dced993fe90d2" due to: ' + e);
            }
        }
    },
    '(()=>{const e={apply:(e,t,n)=>{try{const[e,r]=n,a=r?.toString();if("click"===e&&a?.includes("attached")&&t instanceof HTMLElement&&t.matches(".share-embed-container"))return}catch(e){}return Reflect.apply(e,t,n)}};window.EventTarget.prototype.addEventListener=new Proxy(window.EventTarget.prototype.addEventListener,e)})();': {
        uniqueId: "671bbc53b2753ab1de38c607e44cff6b",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["671bbc53b2753ab1de38c607e44cff6b"] !== e) {
                    (() => {
                        const e = {
                            apply: (e, t, n) => {
                                try {
                                    const [e, r] = n, o = r?.toString();
                                    if ("click" === e && o?.includes("attached") && t instanceof HTMLElement && t.matches(".share-embed-container")) return;
                                } catch (e) {}
                                return Reflect.apply(e, t, n);
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "671bbc53b2753ab1de38c607e44cff6b" due to: ' + e);
            }
        }
    },
    'document.cookie="dl-mobile-banner=hidden;path=/";': {
        uniqueId: "8b440f9710dbfd56131d1f8c2abc993c",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["8b440f9710dbfd56131d1f8c2abc993c"] !== e) {
                    document.cookie = "dl-mobile-banner=hidden;path=/";
                    Object.defineProperty(Window.prototype.toString, "8b440f9710dbfd56131d1f8c2abc993c", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "8b440f9710dbfd56131d1f8c2abc993c" due to: ' + e);
            }
        }
    },
    'document.cookie="downloadcta-state=hidden;path=/";': {
        uniqueId: "1d980de172103bc108eaf73424fc9bb2",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["1d980de172103bc108eaf73424fc9bb2"] !== e) {
                    document.cookie = "downloadcta-state=hidden;path=/";
                    Object.defineProperty(Window.prototype.toString, "1d980de172103bc108eaf73424fc9bb2", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "1d980de172103bc108eaf73424fc9bb2" due to: ' + e);
            }
        }
    },
    '(function(){-1==document.cookie.indexOf("native-app-topper")&&(document.cookie="native-app-topper="+Date.now()+"; path=/;",location.reload())})();': {
        uniqueId: "9d74c934588df2de463c39e31e3adc10",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["9d74c934588df2de463c39e31e3adc10"] !== e) {
                    -1 == document.cookie.indexOf("native-app-topper") && (document.cookie = "native-app-topper=" + Date.now() + "; path=/;", 
                    location.reload());
                    Object.defineProperty(Window.prototype.toString, "9d74c934588df2de463c39e31e3adc10", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "9d74c934588df2de463c39e31e3adc10" due to: ' + e);
            }
        }
    },
    '(function(){var a=new Date;a=a.getFullYear()+"-"+(a.getMonth()+1)+"-"+a.getDate();document.cookie="closed="+a})();': {
        uniqueId: "fe33bd03974a18f9ee09ea4bd62ae980",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.fe33bd03974a18f9ee09ea4bd62ae980 !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "fe33bd03974a18f9ee09ea4bd62ae980" due to: ' + e);
            }
        }
    },
    'document.cookie="com.digidust.elokence.akinator.freemium-smartbanner-closed=true; path=/;";': {
        uniqueId: "6e884abc83f56c42a030fb5b7c6a7e21",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["6e884abc83f56c42a030fb5b7c6a7e21"] !== e) {
                    document.cookie = "com.digidust.elokence.akinator.freemium-smartbanner-closed=true; path=/;";
                    Object.defineProperty(Window.prototype.toString, "6e884abc83f56c42a030fb5b7c6a7e21", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "6e884abc83f56c42a030fb5b7c6a7e21" due to: ' + e);
            }
        }
    },
    'document.cookie="sb-closed=true; path=/;";': {
        uniqueId: "5d933778415cb98cdeaf6df08d1c3ad3",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["5d933778415cb98cdeaf6df08d1c3ad3"] !== e) {
                    document.cookie = "sb-closed=true; path=/;";
                    Object.defineProperty(Window.prototype.toString, "5d933778415cb98cdeaf6df08d1c3ad3", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "5d933778415cb98cdeaf6df08d1c3ad3" due to: ' + e);
            }
        }
    },
    "(function(){var b=window.setTimeout;window.setTimeout=function(a,c){if(!/loadAppStoreBanner/.test(a.toString()))return b(a,c)};})();": {
        uniqueId: "4a9a4c88d375de003f5ff00b3d926a2e",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["4a9a4c88d375de003f5ff00b3d926a2e"] !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "4a9a4c88d375de003f5ff00b3d926a2e" due to: ' + e);
            }
        }
    },
    "(()=>{try{\"undefined\"!=typeof sessionStorage&&sessionStorage.setItem('status_of_app_redirect_half_modal_on_coordinate_list','{\"displayed\":true}')}catch(e){}})();": {
        uniqueId: "841929c3b3752cac36f58f9d0edfdb54",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["841929c3b3752cac36f58f9d0edfdb54"] !== e) {
                    (() => {
                        try {
                            "undefined" != typeof sessionStorage && sessionStorage.setItem("status_of_app_redirect_half_modal_on_coordinate_list", '{"displayed":true}');
                        } catch (e) {}
                    })();
                    Object.defineProperty(Window.prototype.toString, "841929c3b3752cac36f58f9d0edfdb54", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "841929c3b3752cac36f58f9d0edfdb54" due to: ' + e);
            }
        }
    },
    '(()=>{var b=EventTarget.prototype.addEventListener,c=function(a,b){var c=document.querySelector("button.AppHeader-login");c&&b.bind(c)("click",function(){d.disconnect()},{once:!0})},d=new MutationObserver(function(){var a=document.querySelector(".Modal-wrapper .signFlowModal > .Modal-closeButton");a&&(d.disconnect(),e.disconnect(),a.click())});d.observe(document,{childList:!0,subtree:!0});var e=new MutationObserver(a=>{c(a,b)});e.observe(document,{childList:!0,subtree:!0}),setTimeout(function(){e.disconnect(),d.disconnect()},5E3)})();': {
        uniqueId: "41bf8021e5a5f51b455d8d18dce0c4d0",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["41bf8021e5a5f51b455d8d18dce0c4d0"] !== e) {
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
                                var n = document.querySelector("button.AppHeader-login");
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
                    Object.defineProperty(Window.prototype.toString, "41bf8021e5a5f51b455d8d18dce0c4d0", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "41bf8021e5a5f51b455d8d18dce0c4d0" due to: ' + e);
            }
        }
    },
    '(function(){if(!document.cookie.includes("zip_and_city=")){var a=encodeURIComponent(\'{"zip":"","city":""}\');document.cookie="zip_and_city="+a+"; path=/;"}})();': {
        uniqueId: "150eefbfeffab2cb6822c774c048adf4",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["150eefbfeffab2cb6822c774c048adf4"] !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "150eefbfeffab2cb6822c774c048adf4" due to: ' + e);
            }
        }
    },
    "(function(){var b=window.alert;window.alert=function(a){if(!/do geolokalizacji/.test(a.toString()))return b(a)};})();": {
        uniqueId: "1362854a89198b0689400538f0b1a4dc",
        func: () => {
            try {
                const t = "done";
                if (Window.prototype.toString["1362854a89198b0689400538f0b1a4dc"] !== t) {
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
                }
            } catch (t) {
                console.error('Error executing AG js rule with uniqueId "1362854a89198b0689400538f0b1a4dc" due to: ' + t);
            }
        }
    },
    '!function(){if(decodeURIComponent(location.href).startsWith("https://www.wp.pl/?s=portal.abczdrowie.pl")||decodeURIComponent(location.href).startsWith("https://www.wp.pl/?s=parenting.pl"))try{var a=(new URL(window.location.href)).searchParams.get("s");location.replace("https://"+a)}catch(b){}}();': {
        uniqueId: "ec8cfc984fdc64eb0423e2b09bc54f74",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.ec8cfc984fdc64eb0423e2b09bc54f74 !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "ec8cfc984fdc64eb0423e2b09bc54f74" due to: ' + e);
            }
        }
    },
    '!function(){if(decodeURIComponent(location.href).startsWith("https://www.wp.pl/?s=https://"))try{var a=(new URL(window.location.href)).searchParams.get("s");location.replace(a)}catch(b){}}();': {
        uniqueId: "8b26d974cb42343c8f14233fe3c568e8",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["8b26d974cb42343c8f14233fe3c568e8"] !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "8b26d974cb42343c8f14233fe3c568e8" due to: ' + e);
            }
        }
    },
    '(function(){var a=new Date,b=a.getTime();document.cookie="ucs=lbit="+b})();': {
        uniqueId: "bc114c1bbc5dee318bd43b511cdcb308",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.bc114c1bbc5dee318bd43b511cdcb308 !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "bc114c1bbc5dee318bd43b511cdcb308" due to: ' + e);
            }
        }
    },
    "var _st = window.setTimeout; window.setTimeout = function(a, b) { if(!/loginPopup.show/.test(a)){ _st(a,b);}};": {
        uniqueId: "1042964cb83bcd640195f230a152da77",
        func: () => {
            try {
                const t = "done";
                if (Window.prototype.toString["1042964cb83bcd640195f230a152da77"] !== t) {
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
                }
            } catch (t) {
                console.error('Error executing AG js rule with uniqueId "1042964cb83bcd640195f230a152da77" due to: ' + t);
            }
        }
    },
    '!function(){var e=new MutationObserver(function(){document.querySelectorAll(\'div[id^="substream_"] div[id^="hyperfeed_story_id"]\').forEach(function(e){var n=e.querySelectorAll(".userContentWrapper > div[class] > div[class] > div[class]"),o=e.querySelectorAll(".userContentWrapper > div[class] > div > div span");if("display: none !important;"!=e.getAttribute("style")){if(0<n.length&&n[0].innerText.contains("Suggested")){console.log("--------"),t+=1;var l=e.querySelectorAll("a[href]")[2].innerText;console.log("Annoyance hidden from: "+l),console.log("Total annoyances Hidden: "+t),console.log("F length: "+n.length),console.log("--------"),e.style="display:none!important;"}if(0<o.length&&o[0].innerText.contains("People you may know"))console.log("--------"),t+=1,""==(l=e.querySelectorAll("a[href]")[2].innerText)&&(l="Facebook"),console.log("Annoyance hidden from: "+l),console.log("Total annoyances Hidden: "+t),console.log("F length: "+n.length),console.log("--------"),e.style="display:none!important;"}})}),t=0;e.observe(document,{childList:!0,subtree:!0})}();': {
        uniqueId: "2d5a4b03ebe219d77f997c0a788b2eed",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["2d5a4b03ebe219d77f997c0a788b2eed"] !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "2d5a4b03ebe219d77f997c0a788b2eed" due to: ' + e);
            }
        }
    },
    'new MutationObserver(function(){document.querySelectorAll(\'div[role="feed"] > div[data-pagelet^="FeedUnit"] > div[class]:not([style*="height"])\').forEach(function(e){"display: none !important;"==e.getAttribute("style")||e.classList.contains("hidden_elem")||e.querySelectorAll("div[aria-posinset] div[style] div[class] > div[class] > div[class] > div[class] > span")[0].innerText.contains("Suggested for you")&&(console.log("--------"),console.log("Annoyances hidden (Suggested for you)"),e.style="display:none!important;")})}).observe(document,{childList:!0,subtree:!0});': {
        uniqueId: "03e8fcb55c09dc00ea2c8fbc43ccc9ac",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["03e8fcb55c09dc00ea2c8fbc43ccc9ac"] !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "03e8fcb55c09dc00ea2c8fbc43ccc9ac" due to: ' + e);
            }
        }
    },
    'new MutationObserver(function(){document.querySelectorAll(\'div[role="feed"] > span\').forEach(function(e){"display: none !important;"==e.getAttribute("style")||e.classList.contains("hidden_elem")||e.querySelectorAll("div[aria-posinset] div[style] div[class] > div[class] > div[class] > div[class] > span")[0].innerText.contains("Suggested for you")&&(console.log("--------"),console.log("Annoyances hidden (Suggested for you)"),e.style="display:none!important;")})}).observe(document,{childList:!0,subtree:!0});': {
        uniqueId: "7658e09af099cd1524b0fba53dd1cb1c",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["7658e09af099cd1524b0fba53dd1cb1c"] !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "7658e09af099cd1524b0fba53dd1cb1c" due to: ' + e);
            }
        }
    },
    '!function(){var b=0,d=[];new MutationObserver(function(){document.querySelectorAll("#ssrb_feed_start + div > div[class]:not([style*=\\"display: none\\"]), #ssrb_feed_start + div span > h3 ~ div[class]:not([style*=\\"display: none\\"]), #ssrb_feed_start + div h3~ div[class]:not([style*=\\"display: none\\"]), #ssrb_feed_start + div h3 ~ div > div[class]:not([style*=\\"display: none\\"]), div[role=\\"main\\"] div > h3 ~ div > div[class]:not([style*=\\"display: none\\"])").forEach(function(e){Object.keys(e).forEach(function(a){if(a.includes("__reactEvents")||a.includes("__reactProps")){a=e[a];try{if(a.children?.props?.category?.includes("SHOWCASE")||a.children?.props?.children?.props?.category?.includes("SHOWCASE")||a.children?.props?.children?.props?.feedEdge?.category?.includes("SHOWCASE")||a.children?.props?.category?.includes("FB_SHORTS")||a.children?.props?.children?.props?.category?.includes("FB_SHORTS")||a.children?.props?.children?.props?.feedEdge?.category?.includes("FB_SHORTS")){b++,e.style="display: none !important;";var f=e.querySelector("a[href][aria-label]:not([aria-hidden])");f&&(d.push(["SHOWCASE post blocked based on property ["+b+"] -> "+f.ariaLabel]),console.table(d))}}catch(a){}}})})}).observe(document,{childList:!0,subtree:!0})}();': {
        uniqueId: "b1df923a63194358ca6f0ed1143474e5",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.b1df923a63194358ca6f0ed1143474e5 !== e) {
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
                                                var o = n.querySelector("a[href][aria-label]:not([aria-hidden])");
                                                o && (r.push([ "SHOWCASE post blocked based on property [" + e + "] -> " + o.ariaLabel ]), 
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "b1df923a63194358ca6f0ed1143474e5" due to: ' + e);
            }
        }
    },
    "setInterval(function() { var el = document.querySelector('.howto-video video'); if (el) { el.pause(); el.src = ''; }}, 100);": {
        uniqueId: "6037ae33aba3b05f056f756787dd2f13",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["6037ae33aba3b05f056f756787dd2f13"] !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "6037ae33aba3b05f056f756787dd2f13" due to: ' + e);
            }
        }
    },
    'document.addEventListener(\'DOMContentLoaded\', function(){setTimeout(function(){var a=document.querySelector(".onp-sl-content");if("function"===typeof jQuery&&"object"===typeof bizpanda.lockerOptions&&a)try{a=0;for(var c=Object.keys(bizpanda.lockerOptions);a<c.length;a++){var d=c[a];if(d.includes("onpLock")){var b=bizpanda.lockerOptions[d];b&&jQuery.ajax({url:b.ajaxUrl,method:"post",data:{lockerId:b.lockerId,action:"opanda_loader",hash:b.contentHash},success:function(a){var b=jQuery(".onp-sl-content"),c=jQuery(".onp-sl-social-locker"); b.append(a);b.css("display","block");c.css("display","none")}})}}}catch(e){}},1E3)});': {
        uniqueId: "f8726a98e9ee7f87afd7c9376374eb99",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.f8726a98e9ee7f87afd7c9376374eb99 !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "f8726a98e9ee7f87afd7c9376374eb99" due to: ' + e);
            }
        }
    },
    '(async()=>{if(location.href.includes("?slid="))try{const t=new URLSearchParams(location.search).get("slid");if(!t||!t.length)return;const a=await fetch(`https://hotmediahub.com/shorturl/getoriginurl?&surl_key=${t}`),i=await a.json();i?.data?.origin_url&&i.data.origin_url.startsWith("http")&&location.assign(i.data.origin_url)}catch(t){console.debug(t)}})();': {
        uniqueId: "4563128700b6c48955f528992fe0d2f6",
        func: () => {
            try {
                const t = "done";
                if (Window.prototype.toString["4563128700b6c48955f528992fe0d2f6"] !== t) {
                    (async () => {
                        if (location.href.includes("?slid=")) try {
                            const t = new URLSearchParams(location.search).get("slid");
                            if (!t || !t.length) return;
                            const e = await fetch(`https://hotmediahub.com/shorturl/getoriginurl?&surl_key=${t}`), r = await e.json();
                            r?.data?.origin_url && r.data.origin_url.startsWith("http") && location.assign(r.data.origin_url);
                        } catch (t) {
                            console.debug(t);
                        }
                    })();
                    Object.defineProperty(Window.prototype.toString, "4563128700b6c48955f528992fe0d2f6", {
                        value: t,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (t) {
                console.error('Error executing AG js rule with uniqueId "4563128700b6c48955f528992fe0d2f6" due to: ' + t);
            }
        }
    },
    '(async()=>{if(location.href.includes("/slmiddlepage/"))try{const t=location.href.split("/").at(-1);if(!t.length)return;const a=await fetch(`https://terabox.fun/api/shortlink/getoriginurl?&encrypt_surl_key=${t}`),i=await a.json();i?.data?.origin_url&&i.data.origin_url.startsWith("http")&&location.assign(i.data.origin_url)}catch(t){console.debug(t)}})();': {
        uniqueId: "0e073ac7dd901115bdce2b79ff3dfb14",
        func: () => {
            try {
                const t = "done";
                if (Window.prototype.toString["0e073ac7dd901115bdce2b79ff3dfb14"] !== t) {
                    (async () => {
                        if (location.href.includes("/slmiddlepage/")) try {
                            const t = location.href.split("/").at(-1);
                            if (!t.length) return;
                            const e = await fetch(`https://terabox.fun/api/shortlink/getoriginurl?&encrypt_surl_key=${t}`), r = await e.json();
                            r?.data?.origin_url && r.data.origin_url.startsWith("http") && location.assign(r.data.origin_url);
                        } catch (t) {
                            console.debug(t);
                        }
                    })();
                    Object.defineProperty(Window.prototype.toString, "0e073ac7dd901115bdce2b79ff3dfb14", {
                        value: t,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (t) {
                console.error('Error executing AG js rule with uniqueId "0e073ac7dd901115bdce2b79ff3dfb14" due to: ' + t);
            }
        }
    },
    '(async()=>{if(location.href.includes("/sl/"))try{const t=location.href.split("/").at(-1);if(!t.length)return;const a=await fetch(`https://terabox.fun/shorturl/getoriginurl?&surl_key=${t}`),i=await a.json();i?.data?.origin_url&&i.data.origin_url.startsWith("http")&&location.assign(i.data.origin_url)}catch(t){console.debug(t)}})();': {
        uniqueId: "c902dd6dcc6d8edbd75819fe5a8c796f",
        func: () => {
            try {
                const t = "done";
                if (Window.prototype.toString.c902dd6dcc6d8edbd75819fe5a8c796f !== t) {
                    (async () => {
                        if (location.href.includes("/sl/")) try {
                            const t = location.href.split("/").at(-1);
                            if (!t.length) return;
                            const e = await fetch(`https://terabox.fun/shorturl/getoriginurl?&surl_key=${t}`), r = await e.json();
                            r?.data?.origin_url && r.data.origin_url.startsWith("http") && location.assign(r.data.origin_url);
                        } catch (t) {
                            console.debug(t);
                        }
                    })();
                    Object.defineProperty(Window.prototype.toString, "c902dd6dcc6d8edbd75819fe5a8c796f", {
                        value: t,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (t) {
                console.error('Error executing AG js rule with uniqueId "c902dd6dcc6d8edbd75819fe5a8c796f" due to: ' + t);
            }
        }
    },
    '(function(){try{var a=location.href.split("/#");if(a[1]){a=a[1];for(var b=0;10>b;b++){a=atob(a);try{new URL(decodeURIComponent(a));var c=!0}catch(d){c=!1}if(c)try{location.assign(decodeURIComponent(a));break}catch(d){}}}}catch(d){}})();': {
        uniqueId: "32d9aaa2320ef0aacd203039342dcf58",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["32d9aaa2320ef0aacd203039342dcf58"] !== e) {
                    !function() {
                        try {
                            var e = location.href.split("/#");
                            if (e[1]) {
                                e = e[1];
                                for (var a = 0; 10 > a; a++) {
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
                    Object.defineProperty(Window.prototype.toString, "32d9aaa2320ef0aacd203039342dcf58", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "32d9aaa2320ef0aacd203039342dcf58" due to: ' + e);
            }
        }
    },
    '(function(){if(location.href.includes("/aHR0c"))try{let a=location.href.substring(location.href.indexOf("aHR0c"));a=atob(a),location.assign(decodeURIComponent(a))}catch(a){}})();': {
        uniqueId: "456ba5931d5112b0319da728f07d150b",
        func: () => {
            try {
                const o = "done";
                if (Window.prototype.toString["456ba5931d5112b0319da728f07d150b"] !== o) {
                    !function() {
                        if (location.href.includes("/aHR0c")) try {
                            let o = location.href.substring(location.href.indexOf("aHR0c"));
                            o = atob(o), location.assign(decodeURIComponent(o));
                        } catch (o) {}
                    }();
                    Object.defineProperty(Window.prototype.toString, "456ba5931d5112b0319da728f07d150b", {
                        value: o,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (o) {
                console.error('Error executing AG js rule with uniqueId "456ba5931d5112b0319da728f07d150b" due to: ' + o);
            }
        }
    },
    '(()=>{if(location.href.includes("?s=http")){const a=location.href.split("?s=").slice(1);try{location.assign(a)}catch(a){}}})();': {
        uniqueId: "c577d251fe722ea90d3bb1001c6c6e11",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.c577d251fe722ea90d3bb1001c6c6e11 !== e) {
                    (() => {
                        if (location.href.includes("?s=http")) {
                            const e = location.href.split("?s=").slice(1);
                            try {
                                location.assign(e);
                            } catch (e) {}
                        }
                    })();
                    Object.defineProperty(Window.prototype.toString, "c577d251fe722ea90d3bb1001c6c6e11", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "c577d251fe722ea90d3bb1001c6c6e11" due to: ' + e);
            }
        }
    },
    '!function(){if(location.href.includes("wpsafelink")){var e=new MutationObserver((function(){try{var t=document.querySelector(\'form#landing > input[name="go"][value]\'),n=document.querySelector("body > script");t&&t.value.startsWith("aHR0c")&&n&&n.textContent.includes("document.getElementById(\'landing\').submit();")&&(n.remove(),e.disconnect(),location.assign(atob(t.value)))}catch(e){}}));e.observe(document,{childList:!0,subtree:!0}),setTimeout((function(){e.disconnect()}),1e4)}}();': {
        uniqueId: "eb7c35a03ee3cc3b96b7bb0b0d90a333",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.eb7c35a03ee3cc3b96b7bb0b0d90a333 !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "eb7c35a03ee3cc3b96b7bb0b0d90a333" due to: ' + e);
            }
        }
    },
    '!function(){if(-1<location.href.indexOf("?data=aHR0c")){var a=(new URL(window.location.href)).searchParams.get("data");if(a)try{window.location.assign(atob(a))}catch(b){}}}();': {
        uniqueId: "44bad01b6f166fd09caa76089752d560",
        func: () => {
            try {
                const a = "done";
                if (Window.prototype.toString["44bad01b6f166fd09caa76089752d560"] !== a) {
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
                }
            } catch (a) {
                console.error('Error executing AG js rule with uniqueId "44bad01b6f166fd09caa76089752d560" due to: ' + a);
            }
        }
    },
    '!function(){if(-1<location.href.indexOf("?wpsafelink=http")){var a=(new URL(window.location.href)).searchParams.get("wpsafelink");if(a)try{window.location.assign(a)}catch(b){}}}();': {
        uniqueId: "11a8706f0dda4c1354a0f23ace755f3f",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["11a8706f0dda4c1354a0f23ace755f3f"] !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "11a8706f0dda4c1354a0f23ace755f3f" due to: ' + e);
            }
        }
    },
    '!function(){if(-1<window.location.href.indexOf("/?go=")){var a=location.href.split("?go=");if(a&&a[1])try{window.location=atob(a[1])}catch(b){}}}();': {
        uniqueId: "74acd4f9bf691bd110a5d483c18ecd56",
        func: () => {
            try {
                const o = "done";
                if (Window.prototype.toString["74acd4f9bf691bd110a5d483c18ecd56"] !== o) {
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
                }
            } catch (o) {
                console.error('Error executing AG js rule with uniqueId "74acd4f9bf691bd110a5d483c18ecd56" due to: ' + o);
            }
        }
    },
    '!function(){if(-1<window.location.href.indexOf("/?redirect=aHR0c")){var a=location.href.split("/?redirect=");if(a&&a[1])try{window.location=atob(a[1])}catch(b){}}}();': {
        uniqueId: "18e9f4638ee3f7cd8505ffa2c9efb0db",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["18e9f4638ee3f7cd8505ffa2c9efb0db"] !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "18e9f4638ee3f7cd8505ffa2c9efb0db" due to: ' + e);
            }
        }
    },
    '!function(){if(-1<location.href.indexOf("?data=")){var b=(new URL(window.location.href)).searchParams.get("data");if(b)try{var a=atob(b);a=a.split("&ulink=")[1];a.startsWith("http")&&window.location.assign(a)}catch(c){}}}();': {
        uniqueId: "d6c3eb40b31cb88fd93e2cbf35857f8c",
        func: () => {
            try {
                const t = "done";
                if (Window.prototype.toString.d6c3eb40b31cb88fd93e2cbf35857f8c !== t) {
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
                }
            } catch (t) {
                console.error('Error executing AG js rule with uniqueId "d6c3eb40b31cb88fd93e2cbf35857f8c" due to: ' + t);
            }
        }
    },
    '!function(){if(-1<window.location.href.indexOf("/?r=aHR0c")){var a=location.href.split("/?r=");if(a&&a[1])try{window.location=atob(a[1])}catch(b){}}}();': {
        uniqueId: "8407ee6883a7daf63bdaba9212c0a5f4",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["8407ee6883a7daf63bdaba9212c0a5f4"] !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "8407ee6883a7daf63bdaba9212c0a5f4" due to: ' + e);
            }
        }
    },
    '(function(){if(location.href.includes("/to/aHR0c"))try{var a=location.href.split("/to/");a=atob(a[1]).split("url=");location=decodeURIComponent(a[1])}catch(b){}})();': {
        uniqueId: "0794ab0bfb2c033b40c21f896b58006a",
        func: () => {
            try {
                const o = "done";
                if (Window.prototype.toString["0794ab0bfb2c033b40c21f896b58006a"] !== o) {
                    !function() {
                        if (location.href.includes("/to/aHR0c")) try {
                            var o = location.href.split("/to/");
                            o = atob(o[1]).split("url=");
                            location = decodeURIComponent(o[1]);
                        } catch (o) {}
                    }();
                    Object.defineProperty(Window.prototype.toString, "0794ab0bfb2c033b40c21f896b58006a", {
                        value: o,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (o) {
                console.error('Error executing AG js rule with uniqueId "0794ab0bfb2c033b40c21f896b58006a" due to: ' + o);
            }
        }
    },
    '(function(){"function"===typeof fetch&&location.href.includes("/?id=")&&fetch(location.href).then(function(e){e.headers.forEach(function(a,f){if("refresh"===f&&a.includes("url=http"))try{if(a.includes("&url=aHR0c")){var b,c=null==(b=a.split(/&url=/))?void 0:b[1];location=atob(c)}else{var d;location=c=null==(d=a.split(/url=(.+)/))?void 0:d[1]}}catch(g){}})})})();': {
        uniqueId: "1aa697d9b99b2928e92895ee3e7133f4",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["1aa697d9b99b2928e92895ee3e7133f4"] !== e) {
                    "function" == typeof fetch && location.href.includes("/?id=") && fetch(location.href).then((function(e) {
                        e.headers.forEach((function(e, t) {
                            if ("refresh" === t && e.includes("url=http")) try {
                                if (e.includes("&url=aHR0c")) {
                                    var o, r = null == (o = e.split(/&url=/)) ? void 0 : o[1];
                                    location = atob(r);
                                } else {
                                    var i;
                                    location = r = null == (i = e.split(/url=(.+)/)) ? void 0 : i[1];
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "1aa697d9b99b2928e92895ee3e7133f4" due to: ' + e);
            }
        }
    },
    '!function(){if(-1<window.location.href.indexOf("out/?aHR0c")){var a=location.href.split("out/?");if(a&&a[1])try{window.location=atob(decodeURIComponent(a[1]))}catch(b){}}}();': {
        uniqueId: "14e7b6eeaed2b6c9766d1673c27e5f11",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["14e7b6eeaed2b6c9766d1673c27e5f11"] !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "14e7b6eeaed2b6c9766d1673c27e5f11" due to: ' + e);
            }
        }
    },
    '!function(){if(window.location.href.includes("api")&&window.location.href.includes("&url=")){var b=location.href.split("&url=")[1];a:{try{var a=new URL(b)}catch(c){a=!1;break a}a="http:"===a.protocol||"https:"===a.protocol}if(a)try{window.location=b}catch(c){}}}();': {
        uniqueId: "a7aa2c291e20b59040377e4089cb13d8",
        func: () => {
            try {
                const o = "done";
                if (Window.prototype.toString.a7aa2c291e20b59040377e4089cb13d8 !== o) {
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
                }
            } catch (o) {
                console.error('Error executing AG js rule with uniqueId "a7aa2c291e20b59040377e4089cb13d8" due to: ' + o);
            }
        }
    },
    '!function(){if(-1<window.location.href.indexOf("/download.php?")&&-1<window.location.href.indexOf("link=aHR0c")){var a=location.href.split("link=");if(a&&a[1])try{window.location=atob(a[1])}catch(b){}}}();': {
        uniqueId: "fbed59262d4b4df211cd5517c4c36cf1",
        func: () => {
            try {
                const o = "done";
                if (Window.prototype.toString.fbed59262d4b4df211cd5517c4c36cf1 !== o) {
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
                }
            } catch (o) {
                console.error('Error executing AG js rule with uniqueId "fbed59262d4b4df211cd5517c4c36cf1" due to: ' + o);
            }
        }
    },
    '(()=>{document.addEventListener(\'DOMContentLoaded\',()=>{const a=function(a){const b=new DOMParser().parseFromString(a,"text/html");return b.documentElement.textContent},b=function(){if("object"==typeof _sharedData&&"string"==typeof _sharedData[0]?.destination){const b=a(_sharedData[0].destination);if(b.startsWith("http"))try{window.location=b}catch(a){}}};if(window._sharedData)b();else{const a=new MutationObserver(function(){window._sharedData&&(a.disconnect(),b())});a.observe(document,{childList:!0,subtree:!0}),setTimeout(function(){a.disconnect()},1E4)}})})();': {
        uniqueId: "9cac65361b045047e010c7826d557bc0",
        func: () => {
            try {
                const t = "done";
                if (Window.prototype.toString["9cac65361b045047e010c7826d557bc0"] !== t) {
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
                }
            } catch (t) {
                console.error('Error executing AG js rule with uniqueId "9cac65361b045047e010c7826d557bc0" due to: ' + t);
            }
        }
    },
    '!function(){if(-1<window.location.href.indexOf(".html?url=aHR0c")){var a=location.href.split(".html?url=");if(a&&a[1])try{window.location=atob(a[1])}catch(b){}}}();': {
        uniqueId: "0b9c803325dd9cf5e623a58f3f42c964",
        func: () => {
            try {
                const o = "done";
                if (Window.prototype.toString["0b9c803325dd9cf5e623a58f3f42c964"] !== o) {
                    !function() {
                        if (-1 < window.location.href.indexOf(".html?url=aHR0c")) {
                            var o = location.href.split(".html?url=");
                            if (o && o[1]) try {
                                window.location = atob(o[1]);
                            } catch (o) {}
                        }
                    }();
                    Object.defineProperty(Window.prototype.toString, "0b9c803325dd9cf5e623a58f3f42c964", {
                        value: o,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (o) {
                console.error('Error executing AG js rule with uniqueId "0b9c803325dd9cf5e623a58f3f42c964" due to: ' + o);
            }
        }
    },
    '!function(){if(-1<location.href.indexOf("/aHR0c")){var a=location.href.split("/").pop();if(a&&a.includes("aHR0c"))try{location=decodeURIComponent(atob(a))}catch(b){}}}();': {
        uniqueId: "fa04035c4b218bf538509b1f9bca93d9",
        func: () => {
            try {
                const o = "done";
                if (Window.prototype.toString.fa04035c4b218bf538509b1f9bca93d9 !== o) {
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
                }
            } catch (o) {
                console.error('Error executing AG js rule with uniqueId "fa04035c4b218bf538509b1f9bca93d9" due to: ' + o);
            }
        }
    },
    '!function(){if(-1<window.location.href.indexOf("/gotothedl.html?url=")){var a=location.href.split("/gotothedl.html?url=");if(a&&a[1])try{window.location=atob(a[1])}catch(b){}}}();': {
        uniqueId: "fd6511a662b1e2713ee805351331ec88",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.fd6511a662b1e2713ee805351331ec88 !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "fd6511a662b1e2713ee805351331ec88" due to: ' + e);
            }
        }
    },
    '!function(){if(-1<window.location.href.indexOf("/link/?link=aHR0c")){var a=location.href.split("/link/?link=");if(a&&a[1])try{window.location=atob(a[1])}catch(b){}}}();': {
        uniqueId: "d182d7cd6901d7ba2db76b7116137d30",
        func: () => {
            try {
                const d = "done";
                if (Window.prototype.toString.d182d7cd6901d7ba2db76b7116137d30 !== d) {
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
                }
            } catch (d) {
                console.error('Error executing AG js rule with uniqueId "d182d7cd6901d7ba2db76b7116137d30" due to: ' + d);
            }
        }
    },
    "!function(){if(-1<location.search.indexOf(\"=redirect&href=\")){var url=new URL(window.location.href); var dest=url.searchParams.get('href'); if(dest){location=dest;}}}();": {
        uniqueId: "7e56332d8722973b66fd34d88cd873ac",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["7e56332d8722973b66fd34d88cd873ac"] !== e) {
                    !function() {
                        if (-1 < location.search.indexOf("=redirect&href=")) {
                            var e = new URL(window.location.href).searchParams.get("href");
                            e && (location = e);
                        }
                    }();
                    Object.defineProperty(Window.prototype.toString, "7e56332d8722973b66fd34d88cd873ac", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "7e56332d8722973b66fd34d88cd873ac" due to: ' + e);
            }
        }
    },
    '!function(){if(-1<location.pathname.indexOf("/view.php")){var a=(new URL(window.location.href)).searchParams.get("id");if(a&&-1==document.cookie.indexOf(a))try{document.cookie=a+"=user; path=/;";location.reload();}catch(b){}}}();': {
        uniqueId: "89696970bfadbdff1c23f38046797c74",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["89696970bfadbdff1c23f38046797c74"] !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "89696970bfadbdff1c23f38046797c74" due to: ' + e);
            }
        }
    },
    '(function(){-1==document.cookie.indexOf("exUserId")&&(document.cookie="exUserId=1; domain=.4shared.com; path=/;")})();': {
        uniqueId: "83200f16f2ddab39b258418b8f092a1e",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["83200f16f2ddab39b258418b8f092a1e"] !== e) {
                    -1 == document.cookie.indexOf("exUserId") && (document.cookie = "exUserId=1; domain=.4shared.com; path=/;");
                    Object.defineProperty(Window.prototype.toString, "83200f16f2ddab39b258418b8f092a1e", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "83200f16f2ddab39b258418b8f092a1e" due to: ' + e);
            }
        }
    },
    '!function(){if(-1<location.pathname.indexOf("/redirect")){var a=(new URL(window.location.href)).searchParams.get("to");if(a)try{window.location=atob(a)}catch(b){}}}();': {
        uniqueId: "af354057b5f1999097c4f848b8100343",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.af354057b5f1999097c4f848b8100343 !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "af354057b5f1999097c4f848b8100343" due to: ' + e);
            }
        }
    },
    '!function(){if(-1<window.location.href.indexOf("?url=")){var a=location.href.split("?url=");if(a&&a[1])try{window.location=atob(a[1])}catch(b){}}}();': {
        uniqueId: "8015f163e0243425947c898a301100ae",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["8015f163e0243425947c898a301100ae"] !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "8015f163e0243425947c898a301100ae" due to: ' + e);
            }
        }
    },
    '(()=>{document.addEventListener(\'DOMContentLoaded\',()=>{if(-1<location.pathname.indexOf("/go/")){var b=new MutationObserver(function(){if(document.querySelector("#get_link_btn"))try{[].slice.call(document.getElementsByTagName("script")).some(function(a){a.text.match(/goToUrl \\("/)&&(a=a.text.split(/goToUrl \\("([\\s\\S]*?)"\\);/),location=a[1])})}catch(a){}});b.observe(document,{childList:!0,subtree:!0});setTimeout(function(){b.disconnect()},1E4)}})})();': {
        uniqueId: "1b7a3b5c1b1b60eb96bdd9dfb49f36ed",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["1b7a3b5c1b1b60eb96bdd9dfb49f36ed"] !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "1b7a3b5c1b1b60eb96bdd9dfb49f36ed" due to: ' + e);
            }
        }
    },
    "document.addEventListener('DOMContentLoad', function() { setTimeout(function() { second = 0; }, 300); });": {
        uniqueId: "034a6d2e27669874997985e584d3fc8b",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["034a6d2e27669874997985e584d3fc8b"] !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "034a6d2e27669874997985e584d3fc8b" due to: ' + e);
            }
        }
    },
    '!function(){if(-1<window.location.href.indexOf("/?r=")){var a=location.href.split("?r=");if(a&&a[1])try{window.location=atob(a[1])}catch(b){}}}();': {
        uniqueId: "307379e4f228b3973b29e647d7b9d240",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["307379e4f228b3973b29e647d7b9d240"] !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "307379e4f228b3973b29e647d7b9d240" due to: ' + e);
            }
        }
    },
    "(function(){var c=window.setInterval;window.setInterval=function(f,g){return g===1e3&&/removeAttr\\('disabled'\\)/.test(f.toString())&&(g*=0.01),c.apply(this,arguments)}.bind(window)})();": {
        uniqueId: "8a9f85f8cf15c1e19462f7c54155e865",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["8a9f85f8cf15c1e19462f7c54155e865"] !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "8a9f85f8cf15c1e19462f7c54155e865" due to: ' + e);
            }
        }
    },
    '(()=>{document.addEventListener(\'DOMContentLoaded\',()=>{setTimeout(function(){if("undefined"!==typeof aesCrypto&&"function"===typeof aesCrypto.decrypt&&-1<window.location.href.indexOf("#?o="))try{window.location=aesCrypto.decrypt(window.location.href.split("#?o=")[1].replace(/^\\s+/,"").replace(/\\s+$/,""),"root".replace(/^\\s+/,"").replace(/\\s+$/,""))}catch(a){}},300)})})();': {
        uniqueId: "6d9ca9f617340a6d9976710f1e5a7b50",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["6d9ca9f617340a6d9976710f1e5a7b50"] !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "6d9ca9f617340a6d9976710f1e5a7b50" due to: ' + e);
            }
        }
    },
    '(()=>{document.addEventListener(\'DOMContentLoaded\',()=>{setTimeout(function(){if("undefined"!==typeof aesCrypto&&"function"===typeof aesCrypto.decrypt&&-1<window.location.href.indexOf("#?o="))try{window.location=aesCrypto.decrypt($.urlParam("o").replace(/^\\s+/,"").replace(/\\s+$/,""),"root".replace(/^\\s+/,"").replace(/\\s+$/,""))}catch(a){}},300)})})();': {
        uniqueId: "e3c828d254377a11d58cabf38f975080",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.e3c828d254377a11d58cabf38f975080 !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "e3c828d254377a11d58cabf38f975080" due to: ' + e);
            }
        }
    },
    '(()=>{document.addEventListener(\'DOMContentLoaded\',()=>{setTimeout(function(){if("function"===typeof convertstr&&"function"===typeof aesCrypto.decrypt&&-1<window.location.href.indexOf("html#?o="))try{window.location=aesCrypto.decrypt(convertstr($.urlParam("o")),convertstr("root"))}catch(a){}},300)})})();': {
        uniqueId: "e50329594db3b07068dcf74209e441a3",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.e50329594db3b07068dcf74209e441a3 !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "e50329594db3b07068dcf74209e441a3" due to: ' + e);
            }
        }
    },
    "(function(){var c=window.setInterval;window.setInterval=function(f,g){return g===1e3&&/'#timer'/.test(f.toString())&&(g*=0.01),c.apply(this,arguments)}.bind(window)})();": {
        uniqueId: "de338228231bafa3ab4463a596c1790d",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.de338228231bafa3ab4463a596c1790d !== e) {
                    !function() {
                        var e = window.setInterval;
                        window.setInterval = function(t, n) {
                            return 1e3 === n && /'#timer'/.test(t.toString()) && (n *= .01), e.apply(this, arguments);
                        }.bind(window);
                    }();
                    Object.defineProperty(Window.prototype.toString, "de338228231bafa3ab4463a596c1790d", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "de338228231bafa3ab4463a596c1790d" due to: ' + e);
            }
        }
    },
    "(function(){var c=window.setTimeout;window.setTimeout=function(f,g){return g===1e3&&/TheLink/.test(f.toString())&&(g*=0.01),c.apply(this,arguments)}.bind(window)})();": {
        uniqueId: "a3a19d6d5950cc6759710e4021c08a41",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.a3a19d6d5950cc6759710e4021c08a41 !== e) {
                    !function() {
                        var e = window.setTimeout;
                        window.setTimeout = function(t, o) {
                            return 1e3 === o && /TheLink/.test(t.toString()) && (o *= .01), e.apply(this, arguments);
                        }.bind(window);
                    }();
                    Object.defineProperty(Window.prototype.toString, "a3a19d6d5950cc6759710e4021c08a41", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "a3a19d6d5950cc6759710e4021c08a41" due to: ' + e);
            }
        }
    },
    '(()=>{const a=new MutationObserver(function(){const b=document.querySelector("script[src^=\\"/assets/js/unlock.js\\"]");if(b){a.disconnect();let c;for(let a of b.attributes)if(a.textContent.includes("aHR0c")){c=a.textContent;break}c&&setTimeout(function(){location.assign(atob(c))},500)}});a.observe(document,{childList:!0,subtree:!0})})();': {
        uniqueId: "36bc1f9853e93deac861c56d6200a5b0",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["36bc1f9853e93deac861c56d6200a5b0"] !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "36bc1f9853e93deac861c56d6200a5b0" due to: ' + e);
            }
        }
    },
    '(()=>{document.addEventListener(\'DOMContentLoaded\',()=>{if(-1!==window.location.href.indexOf("onet.pl/?utm_source=")){const o=new MutationObserver(function(){var e=document.querySelector(\'a[href][onclick*="Nitro_clickmore"][onclick*="czytaj_wiecej"], a[href][class^="NitroCard_sectionLink_"], article[class^="NitroCard_nitroCard__"] > a[href][class^="Common_sectionLink__"]:not([href^="undefined"])\');e&&(o.disconnect(),location.replace(e.href))});o.observe(document,{childList:!0,subtree:!0}),setTimeout(function(){o.disconnect()},1e4)}})})();': {
        uniqueId: "1ef1848adf82a2225338e1cf0d384d9f",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["1ef1848adf82a2225338e1cf0d384d9f"] !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "1ef1848adf82a2225338e1cf0d384d9f" due to: ' + e);
            }
        }
    },
    "!function(){if(-1<location.pathname.indexOf(\"/pushredirect/\")){var url=new URL(window.location.href); var dest=url.searchParams.get('dest'); if(dest){location=dest;}}}();": {
        uniqueId: "6b5cea966014c82ed21c8c5706e0bee8",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["6b5cea966014c82ed21c8c5706e0bee8"] !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "6b5cea966014c82ed21c8c5706e0bee8" due to: ' + e);
            }
        }
    },
    '!function(){if(-1<window.location.href.indexOf("dynamic?r=")&&!/https?:\\/\\/(www\\.)?h-gen\\.xyz\\//.test(document.referrer)){var a=location.href.split("?r=");if(a&&a[1])try{window.location=atob(a[1])}catch(b){}}}();': {
        uniqueId: "fefa615247862ad4c7b0ecd9355c39fd",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.fefa615247862ad4c7b0ecd9355c39fd !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "fefa615247862ad4c7b0ecd9355c39fd" due to: ' + e);
            }
        }
    },
    "!function(){const t={apply:(t,e,n)=>{const a=Reflect.apply(t,e,n);return a?.data?.getDetailPageContent?.linkCustomAdOffers&&(a.data.getDetailPageContent.linkCustomAdOffers=[]),a}};window.JSON.parse=new Proxy(window.JSON.parse,t)}();": {
        uniqueId: "c4448628d8540260def416c0db16d29f",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.c4448628d8540260def416c0db16d29f !== e) {
                    !function() {
                        const e = {
                            apply: (e, t, o) => {
                                const n = Reflect.apply(e, t, o);
                                return n?.data?.getDetailPageContent?.linkCustomAdOffers && (n.data.getDetailPageContent.linkCustomAdOffers = []), 
                                n;
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "c4448628d8540260def416c0db16d29f" due to: ' + e);
            }
        }
    },
    "(() => {document.addEventListener(\"DOMContentLoaded\", (() => {setTimeout(function() { if(typeof player.pause != 'undefined') { player.pause(); } }, 3000);}));})();": {
        uniqueId: "a74d879c7ac45de88fa5296db6cc0537",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.a74d879c7ac45de88fa5296db6cc0537 !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "a74d879c7ac45de88fa5296db6cc0537" due to: ' + e);
            }
        }
    },
    '(function(){var a="http"+(new URL(window.location.href)).searchParams.get("xurl");try{new URL(a);var b=!0}catch(c){b=!1}if(b)try{window.location=a}catch(c){}})();': {
        uniqueId: "df209bc351ff0553f6a35cad491038e2",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.df209bc351ff0553f6a35cad491038e2 !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "df209bc351ff0553f6a35cad491038e2" due to: ' + e);
            }
        }
    },
    "window.self = window.top;": {
        uniqueId: "443a08e7b42a84571d7f5117b4d64c9f",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["443a08e7b42a84571d7f5117b4d64c9f"] !== e) {
                    window.self = window.top;
                    Object.defineProperty(Window.prototype.toString, "443a08e7b42a84571d7f5117b4d64c9f", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "443a08e7b42a84571d7f5117b4d64c9f" due to: ' + e);
            }
        }
    },
    'window.addEventListener("contextmenu",function(a){a.stopPropagation()},!0);': {
        uniqueId: "99382d0bad7923913149eaceb54a5bcd",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["99382d0bad7923913149eaceb54a5bcd"] !== e) {
                    window.addEventListener("contextmenu", (function(e) {
                        e.stopPropagation();
                    }), !0);
                    Object.defineProperty(Window.prototype.toString, "99382d0bad7923913149eaceb54a5bcd", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "99382d0bad7923913149eaceb54a5bcd" due to: ' + e);
            }
        }
    },
    '(()=>{document.addEventListener("DOMContentLoaded",(()=>{var b=document.getElementById("sm_dl_wait");if(b){var c=document.createElement("a");c.setAttribute("href",b.getAttribute("data-id"));c.innerHTML="<b>"+("function"==typeof window.a?IMSLPGetMsg("js-s"):"Click here to continue your download.")+"</b>";var d=document.createElement("style");d.innerHTML="#sm_dl_wait{display:none!important;}";b.parentNode.insertBefore(c,b);b.parentNode.insertBefore(d,b)}}));})();': {
        uniqueId: "7b45e913b52ddafeab6005ad59c3472a",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["7b45e913b52ddafeab6005ad59c3472a"] !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "7b45e913b52ddafeab6005ad59c3472a" due to: ' + e);
            }
        }
    },
    '(()=>{["contextmenu","copy","selectstart"].forEach((o=>{window.addEventListener(o,(o=>{o.stopPropagation()}),!0)}));})();': {
        uniqueId: "58381ff8715080c5ddef89be33326b0c",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["58381ff8715080c5ddef89be33326b0c"] !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "58381ff8715080c5ddef89be33326b0c" due to: ' + e);
            }
        }
    },
    'window.addEventListener("contextmenu",function(a){a.stopPropagation()},!0); window.addEventListener("copy",function(a){a.stopPropagation()},!0);': {
        uniqueId: "f5bda0983617c9e82a78a551426bbb32",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.f5bda0983617c9e82a78a551426bbb32 !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "f5bda0983617c9e82a78a551426bbb32" due to: ' + e);
            }
        }
    },
    "Object.defineProperties(window,{sccopytext:{value:function(){}},add_message_to_copied_text:{value:function(){}}});Object.defineProperties(document,{onkeydown:{value:function(){}},onkeypress:{value:function(){}}});": {
        uniqueId: "b232522280fe8811482fd08407b45719",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.b232522280fe8811482fd08407b45719 !== e) {
                    Object.defineProperties(window, {
                        sccopytext: {
                            value: function() {}
                        },
                        add_message_to_copied_text: {
                            value: function() {}
                        }
                    });
                    Object.defineProperties(document, {
                        onkeydown: {
                            value: function() {}
                        },
                        onkeypress: {
                            value: function() {}
                        }
                    });
                    Object.defineProperty(Window.prototype.toString, "b232522280fe8811482fd08407b45719", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "b232522280fe8811482fd08407b45719" due to: ' + e);
            }
        }
    },
    "(function(){z=self.EventTarget.prototype.addEventListener;self.EventTarget.prototype.addEventListener=function(a,b){if(!/cut|copy|paste/.test(a.toString()))return z.apply(this,arguments)}})();": {
        uniqueId: "8342d640dabc53d6d2d38df78178b78e",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["8342d640dabc53d6d2d38df78178b78e"] !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "8342d640dabc53d6d2d38df78178b78e" due to: ' + e);
            }
        }
    },
    '(function(){const b=function(d){const a=Math.pow(10,d-1),b=Math.pow(10,d);return Math.floor(Math.random()*(b-a)+a)}(12);window.addEventListener("load",function(){window.google_image_requests=[],window.google_global_correlator=b,window._hmt=window._hmt||[],_hmt.id=b})})();': {
        uniqueId: "eb04a415377ef4ca383dbeb96bc0959d",
        func: () => {
            try {
                const o = "done";
                if (Window.prototype.toString.eb04a415377ef4ca383dbeb96bc0959d !== o) {
                    !function() {
                        const o = function() {
                            const o = Math.pow(10, 11), e = Math.pow(10, 12);
                            return Math.floor(Math.random() * (e - o) + o);
                        }();
                        window.addEventListener("load", (function() {
                            window.google_image_requests = [], window.google_global_correlator = o, window._hmt = window._hmt || [], 
                            _hmt.id = o;
                        }));
                    }();
                    Object.defineProperty(Window.prototype.toString, "eb04a415377ef4ca383dbeb96bc0959d", {
                        value: o,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (o) {
                console.error('Error executing AG js rule with uniqueId "eb04a415377ef4ca383dbeb96bc0959d" due to: ' + o);
            }
        }
    },
    'function preventError(d){window.addEventListener("error",function(a){if(a.srcElement&&a.srcElement.src){const b=new RegExp(d);b.test(a.srcElement.src)&&(a.srcElement.onerror=function(){})}},!0)}preventError(/^(?!.*(rt-error.js)).*$/);': {
        uniqueId: "2c65b37bc179c213f5741f032fbc81bd",
        func: () => {
            try {
                const r = "done";
                if (Window.prototype.toString["2c65b37bc179c213f5741f032fbc81bd"] !== r) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "2c65b37bc179c213f5741f032fbc81bd" due to: ' + e);
            }
        }
    },
    "(function(){var b=window.setTimeout;window.setTimeout=function(a,c){if(!/myaaqqbpfun12\\(\\)/.test(a.toString()))return b(a,c)};})();": {
        uniqueId: "d0fc82b069eb2ac72f8e46e7308e2540",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.d0fc82b069eb2ac72f8e46e7308e2540 !== e) {
                    !function() {
                        var e = window.setTimeout;
                        window.setTimeout = function(t, o) {
                            if (!/myaaqqbpfun12\(\)/.test(t.toString())) return e(t, o);
                        };
                    }();
                    Object.defineProperty(Window.prototype.toString, "d0fc82b069eb2ac72f8e46e7308e2540", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "d0fc82b069eb2ac72f8e46e7308e2540" due to: ' + e);
            }
        }
    },
    "window.ad = window.ads = window.dzad = window.dzads = true;": {
        uniqueId: "ae3e820b38653aaf630b5b70d22a1bb6",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.ae3e820b38653aaf630b5b70d22a1bb6 !== e) {
                    window.ad = window.ads = window.dzad = window.dzads = !0;
                    Object.defineProperty(Window.prototype.toString, "ae3e820b38653aaf630b5b70d22a1bb6", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "ae3e820b38653aaf630b5b70d22a1bb6" due to: ' + e);
            }
        }
    },
    "(function(){var b=window.setTimeout;window.setTimeout=function(a,c){if(!/Adblock/.test(a.toString()))return b(a,c)};})();": {
        uniqueId: "e156fcdd4472579f7801d0e4acc20c97",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.e156fcdd4472579f7801d0e4acc20c97 !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "e156fcdd4472579f7801d0e4acc20c97" due to: ' + e);
            }
        }
    },
    "(function(){window._czc={push:function(){}}})();": {
        uniqueId: "23ea3840e6c6f4717038a47e91ac5633",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["23ea3840e6c6f4717038a47e91ac5633"] !== e) {
                    window._czc = {
                        push: function() {}
                    };
                    Object.defineProperty(Window.prototype.toString, "23ea3840e6c6f4717038a47e91ac5633", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "23ea3840e6c6f4717038a47e91ac5633" due to: ' + e);
            }
        }
    },
    "(()=>{let e=!1;window.qyMesh=window.qyMesh||{},window.qyMesh=new Proxy(window.qyMesh,{get:function(a,t,d){return!e&&a?.preload?.Page_recommend_1?.response?.items&&(a.preload.Page_recommend_1.response.items.forEach((e=>{e.extData?.dataExtAd&&(e.extData.dataExtAd={}),e.video&&e.video.forEach((e=>{e.adverts&&(e.adverts=[]),e.data&&(e.data=e.data.filter((e=>!e.ad)))}))})),e=!0),Reflect.get(a,t,d)}})})();": {
        uniqueId: "fde1dae48543296e9f6bd72f2157ce95",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.fde1dae48543296e9f6bd72f2157ce95 !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "fde1dae48543296e9f6bd72f2157ce95" due to: ' + e);
            }
        }
    },
    '(function(){window.eval=new Proxy(eval,{apply:(e,c,n)=>{const o=Reflect.apply(e,c,n);if("object"==typeof o&&o.banners)try{o.banners.forEach(((e,c)=>{e.commercial&&(e.commercial={})}))}catch(e){console.debug(e)}return o}})})();': {
        uniqueId: "119696f6d27a9b6c225cdaa7954a52fd",
        func: () => {
            try {
                const flag = "done";
                if (Window.prototype.toString["119696f6d27a9b6c225cdaa7954a52fd"] !== flag) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "119696f6d27a9b6c225cdaa7954a52fd" due to: ' + e);
            }
        }
    },
    "setTimeout(function() { var el = document.querySelector('input[name=\"dfp\"]'); if(el){el.value = '1234567890123456';} }, 300);": {
        uniqueId: "a07f45c054f1a02c9581416dcc133e06",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.a07f45c054f1a02c9581416dcc133e06 !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "a07f45c054f1a02c9581416dcc133e06" due to: ' + e);
            }
        }
    },
    "(()=>{const n=function(){};window.pa={avInsights:{Media:function(){return{set:n}}},setConfigurations:n,sendEvent:n,refresh:n,getVisitorId:n}})();": {
        uniqueId: "79d1903ec5ebd79ef6e85148b259526b",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["79d1903ec5ebd79ef6e85148b259526b"] !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "79d1903ec5ebd79ef6e85148b259526b" due to: ' + e);
            }
        }
    },
    '(()=>{window.analytics=[],analytics.user=function(){return this},analytics.track=function(){},analytics.anonymousId=function(){},analytics.push=function(){[...arguments].forEach((n=>{if("function"==typeof n)try{n()}catch(n){console.debug(n)}Array.isArray(n)&&[...n].forEach((n=>{if("function"==typeof n)try{n()}catch(n){console.debug(n)}}))}))};})();': {
        uniqueId: "c5eccff17c5bfd7b81d14b2ae2d579e6",
        func: () => {
            try {
                const c = "done";
                if (Window.prototype.toString.c5eccff17c5bfd7b81d14b2ae2d579e6 !== c) {
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
                }
            } catch (c) {
                console.error('Error executing AG js rule with uniqueId "c5eccff17c5bfd7b81d14b2ae2d579e6" due to: ' + c);
            }
        }
    },
    '(()=>{window.ga=function(){const a=arguments.length;if(0===a)return;const b=arguments[a-1];let c;b instanceof Object&&null!==b&&"function"==typeof b.hitCallback?c=b.hitCallback:"function"==typeof b&&(c=()=>{b(ga.create())});try{setTimeout(c,1)}catch(a){}}})();': {
        uniqueId: "c36460b31e5b7f98f266af7f13766c20",
        func: () => {
            try {
                const t = "done";
                if (Window.prototype.toString.c36460b31e5b7f98f266af7f13766c20 !== t) {
                    window.ga = function() {
                        const t = arguments.length;
                        if (0 === t) return;
                        const e = arguments[t - 1];
                        let o;
                        e instanceof Object && null !== e && "function" == typeof e.hitCallback ? o = e.hitCallback : "function" == typeof e && (o = () => {
                            e(ga.create());
                        });
                        try {
                            setTimeout(o, 1);
                        } catch (t) {}
                    };
                    Object.defineProperty(Window.prototype.toString, "c36460b31e5b7f98f266af7f13766c20", {
                        value: t,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (t) {
                console.error('Error executing AG js rule with uniqueId "c36460b31e5b7f98f266af7f13766c20" due to: ' + t);
            }
        }
    },
    "(()=>{const t={getExperimentStates:function(){return[]}};window.optimizely={get:function(){return t}}})();": {
        uniqueId: "f7c0c8e9372a7fa53bbbce0298119df8",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.f7c0c8e9372a7fa53bbbce0298119df8 !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "f7c0c8e9372a7fa53bbbce0298119df8" due to: ' + e);
            }
        }
    },
    "(()=>{window.google_optimize={get(){}}})();": {
        uniqueId: "36df238a158cc003e8a8e5fdca90b30c",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["36df238a158cc003e8a8e5fdca90b30c"] !== e) {
                    window.google_optimize = {
                        get() {}
                    };
                    Object.defineProperty(Window.prototype.toString, "36df238a158cc003e8a8e5fdca90b30c", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "36df238a158cc003e8a8e5fdca90b30c" due to: ' + e);
            }
        }
    },
    "(()=>{window.tC={event:{track(){}}}})();": {
        uniqueId: "99d72f7c5b99c10e8cdafc4f2cfcb2fd",
        func: () => {
            try {
                const c = "done";
                if (Window.prototype.toString["99d72f7c5b99c10e8cdafc4f2cfcb2fd"] !== c) {
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
                }
            } catch (c) {
                console.error('Error executing AG js rule with uniqueId "99d72f7c5b99c10e8cdafc4f2cfcb2fd" due to: ' + c);
            }
        }
    },
    "(()=>{window.CQ_Analytics={SegmentMgr:{loadSegments(){}},ClientContextUtils:{init(){}}}})();": {
        uniqueId: "8715a0ec32e4b4aacff2e980a0cc496f",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["8715a0ec32e4b4aacff2e980a0cc496f"] !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "8715a0ec32e4b4aacff2e980a0cc496f" due to: ' + e);
            }
        }
    },
    "(function(){window.DD_LOGS={onReady:function(){},logger:{log:function(){}}}})();": {
        uniqueId: "8b87d29cf52f44fbcd9dd5303e9f1ad3",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["8b87d29cf52f44fbcd9dd5303e9f1ad3"] !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "8b87d29cf52f44fbcd9dd5303e9f1ad3" due to: ' + e);
            }
        }
    },
    "(function(){window.swua={swEvent:function(){}}})();": {
        uniqueId: "f28a1bc10a399048b74c1518d0e7b0c4",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.f28a1bc10a399048b74c1518d0e7b0c4 !== e) {
                    window.swua = {
                        swEvent: function() {}
                    };
                    Object.defineProperty(Window.prototype.toString, "f28a1bc10a399048b74c1518d0e7b0c4", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "f28a1bc10a399048b74c1518d0e7b0c4" due to: ' + e);
            }
        }
    },
    "!function(){window.pSUPERFLY={virtualPage:function(){}};}();": {
        uniqueId: "400e65f5eeab811a9c314d5e9dc23b9a",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["400e65f5eeab811a9c314d5e9dc23b9a"] !== e) {
                    window.pSUPERFLY = {
                        virtualPage: function() {}
                    };
                    Object.defineProperty(Window.prototype.toString, "400e65f5eeab811a9c314d5e9dc23b9a", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "400e65f5eeab811a9c314d5e9dc23b9a" due to: ' + e);
            }
        }
    },
    'new MutationObserver(function(){var t=["?fbclid","%3Ffbclid","&fbclid","%26fbclid","&__tn__","%__26tn__","%3Futm","?utm","&fbc=","%26fbc%3D","?share=","%3Fshare%3D","%3F__twitter_impression%3D","?__twitter_impression=","?wtmc=","%3Fwtmc%3D","?originalReferrer=","%3ForiginalReferrer%3D","?wtrid=","%3Fwtrid%3D","?trbo=","%3Ftrbo%3D","?GEPC=","%3FGEPC%3D","?whatsapp=","%3Fwhatsapp%3D","?fbc=","%3Ffbc%3D","?dmcid=","%3Fdmcid%3D"];document.querySelectorAll(\'a[target="_blank"]\').forEach(function(e){for(i=0;i<t.length;i++){var r;e.href.includes(t[i])&&(r=(r=(r=e.href.split("#!")[1])||e.href.split("%23%21")[1])||"",e.href.includes("#!")&&(r="#!"+r),e.href.includes("%23%21")&&(r="%23%21"+r),r=(r=(r=e.href.split("&feature=share&")[1])||e.href.split("%26feature%3Dshare%26")[1])||"",e.href.includes("&feature=share&")&&(r="?"+r),e.href.includes("%26feature%3Dshare%26")&&(r="%3F"+r),r=(r=(r=e.href.split("&h=")[1])||e.href.split("%26h%3D")[1])||"",e.href.includes("&h=")&&(r="&h="+r),e.href.includes("%26h%3D")&&(r="%26h%3D"+r),e.setAttribute("href",e.href.split(t[i])[0]+r))}})}).observe(document,{childList:!0,subtree:!0});': {
        uniqueId: "2ca94c74fb35fa6f5e63d15da842f5b6",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["2ca94c74fb35fa6f5e63d15da842f5b6"] !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "2ca94c74fb35fa6f5e63d15da842f5b6" due to: ' + e);
            }
        }
    },
    'new MutationObserver(function(){var t=["&eid=","%26eid%3D","?eid=","%3Feid%3D","?__tn__=","%3F%5F%5Ftn%5F%5F%3D","&__tn__=","%26%5F%5Ftn%5F%5F%3D","?source=","%3Fsource%3D","?__xts__","%3F%5F%5Fxts%5F%5F","&__xts__","%26%5F%5Fxts%5F%5F","&amp;__xts__%5B","?ref=","%3Fref%3D","?fref=","%3Ffref%3D","?epa=","%3Fepa%3D","&ifg=","%26ifg%3D","?comment_tracking=","%3Fcomment_tracking%3D","?av=","%3Fav%3D","&av=","%26av%3D","?acontext=","%3Facontext%3D","&session_id=","%26session_id%3D","&amp;session_id=","?hc_location=","%3Fhc_location%3D","&fref=","%26fref%3D","?__cft","%3f__cft"];document.querySelectorAll(\'a:not([target="_blank"]):not([href*="2fac/"])\').forEach(function(e){for(i=0;i<t.length;i++)e.href.includes(t[i])&&e.setAttribute("href",e.href.split(t[i])[0])})}).observe(document,{childList:!0,subtree:!0});': {
        uniqueId: "b53943d876c5b199f25b9db1658e015b",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.b53943d876c5b199f25b9db1658e015b !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "b53943d876c5b199f25b9db1658e015b" due to: ' + e);
            }
        }
    },
    "window.yaCounter27017517 ={ reachGoal: function() {} };": {
        uniqueId: "28268c21993e00b00d4bd15a3332c6e1",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["28268c21993e00b00d4bd15a3332c6e1"] !== e) {
                    window.yaCounter27017517 = {
                        reachGoal: function() {}
                    };
                    Object.defineProperty(Window.prototype.toString, "28268c21993e00b00d4bd15a3332c6e1", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "28268c21993e00b00d4bd15a3332c6e1" due to: ' + e);
            }
        }
    },
    "navigator.getBattery = undefined;": {
        uniqueId: "69dbc095579f2637c25f1636d4bd7a84",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["69dbc095579f2637c25f1636d4bd7a84"] !== e) {
                    navigator.getBattery = void 0;
                    Object.defineProperty(Window.prototype.toString, "69dbc095579f2637c25f1636d4bd7a84", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "69dbc095579f2637c25f1636d4bd7a84" due to: ' + e);
            }
        }
    },
    '(function() { window.Ya = window.Ya || {}; window.Ya.Metrika = function() { var a = function() {}; this.replacePhones = this.reachGoal = this.params = this.notBounce = this.hit = this.file = this.extLink = clickmap = trackLinks = this.addFileExtension = a }; var a = [], c = a.push; a.push = function(b) { a._init || "function" !== typeof b || (b(), a._init = !0); c.call(a, b) }; window.yandex_metrika_callbacks = a})();': {
        uniqueId: "a56796f47f0de963d8c564579e5148aa",
        func: () => {
            try {
                const i = "done";
                if (Window.prototype.toString.a56796f47f0de963d8c564579e5148aa !== i) {
                    !function() {
                        window.Ya = window.Ya || {};
                        window.Ya.Metrika = function() {
                            this.replacePhones = this.reachGoal = this.params = this.notBounce = this.hit = this.file = this.extLink = clickmap = trackLinks = this.addFileExtension = function() {};
                        };
                        var i = [], t = i.push;
                        i.push = function(e) {
                            i._init || "function" != typeof e || (e(), i._init = !0);
                            t.call(i, e);
                        };
                        window.yandex_metrika_callbacks = i;
                    }();
                    Object.defineProperty(Window.prototype.toString, "a56796f47f0de963d8c564579e5148aa", {
                        value: i,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (i) {
                console.error('Error executing AG js rule with uniqueId "a56796f47f0de963d8c564579e5148aa" due to: ' + i);
            }
        }
    },
    "var _gaq = []; var _gat = { _getTracker: function() { return { _initData: function(){}, _trackPageview: function(){}, _trackEvent: function(){}, _setAllowLinker: function() {}, _setCustomVar: function() {} } }, _createTracker: function() { return this._getTracker(); }, _anonymizeIp: function() {} };": {
        uniqueId: "9af1bf2ffd37b0dabb58c7227027d089",
        func: () => {
            try {
                const t = "done";
                if (Window.prototype.toString["9af1bf2ffd37b0dabb58c7227027d089"] !== t) {
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
                }
            } catch (t) {
                console.error('Error executing AG js rule with uniqueId "9af1bf2ffd37b0dabb58c7227027d089" due to: ' + t);
            }
        }
    },
    "function urchinTracker() {};": {
        uniqueId: "aad463a3895c1cb1e7e6311e112123e8",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.aad463a3895c1cb1e7e6311e112123e8 !== e) {
                    function urchinTracker() {}
                    Object.defineProperty(Window.prototype.toString, "aad463a3895c1cb1e7e6311e112123e8", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (r) {
                console.error('Error executing AG js rule with uniqueId "aad463a3895c1cb1e7e6311e112123e8" due to: ' + r);
            }
        }
    },
    "window.yaCounter9890803 = { reachGoal: function() {} };": {
        uniqueId: "891411839e95d2a44430b81d04572631",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["891411839e95d2a44430b81d04572631"] !== e) {
                    window.yaCounter9890803 = {
                        reachGoal: function() {}
                    };
                    Object.defineProperty(Window.prototype.toString, "891411839e95d2a44430b81d04572631", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "891411839e95d2a44430b81d04572631" due to: ' + e);
            }
        }
    },
    "window.yaCounter14913877={ reachGoal: function() {} };": {
        uniqueId: "5ac1747a2f0ac39ddd8af63cfdfa1830",
        func: () => {
            try {
                const a = "done";
                if (Window.prototype.toString["5ac1747a2f0ac39ddd8af63cfdfa1830"] !== a) {
                    window.yaCounter14913877 = {
                        reachGoal: function() {}
                    };
                    Object.defineProperty(Window.prototype.toString, "5ac1747a2f0ac39ddd8af63cfdfa1830", {
                        value: a,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (a) {
                console.error('Error executing AG js rule with uniqueId "5ac1747a2f0ac39ddd8af63cfdfa1830" due to: ' + a);
            }
        }
    },
    "window.ga = function(){var a = arguments[5];a&&a.hitCallback&&a.hitCallback();}": {
        uniqueId: "b2af76ffe41c76ed1f7a45e1ed6d7565",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.b2af76ffe41c76ed1f7a45e1ed6d7565 !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "b2af76ffe41c76ed1f7a45e1ed6d7565" due to: ' + e);
            }
        }
    },
    "window.ga = function() {};": {
        uniqueId: "a760a3059d00f32d9d1298bce181428e",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.a760a3059d00f32d9d1298bce181428e !== e) {
                    window.ga = function() {};
                    Object.defineProperty(Window.prototype.toString, "a760a3059d00f32d9d1298bce181428e", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "a760a3059d00f32d9d1298bce181428e" due to: ' + e);
            }
        }
    },
    "window.google_trackConversion = function() {};": {
        uniqueId: "71153fe6d998e6884985cac5294b8a71",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["71153fe6d998e6884985cac5294b8a71"] !== e) {
                    window.google_trackConversion = function() {};
                    Object.defineProperty(Window.prototype.toString, "71153fe6d998e6884985cac5294b8a71", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "71153fe6d998e6884985cac5294b8a71" due to: ' + e);
            }
        }
    },
    "(()=>{window.a2a={init(){}}})();": {
        uniqueId: "c0325f223958d06b946b83a6dd260418",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.c0325f223958d06b946b83a6dd260418 !== e) {
                    window.a2a = {
                        init() {}
                    };
                    Object.defineProperty(Window.prototype.toString, "c0325f223958d06b946b83a6dd260418", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "c0325f223958d06b946b83a6dd260418" due to: ' + e);
            }
        }
    },
    "var addthis = { init: function() {}, addEventListener: function() {}, button: function() {}, counter: function() {}, update: function() {}, toolbox: function() {}, layers: function() {} };": {
        uniqueId: "ba82b6651325f357520ba8af3cd8a9cc",
        func: () => {
            try {
                const t = "done";
                if (Window.prototype.toString.ba82b6651325f357520ba8af3cd8a9cc !== t) {
                    var addthis = {
                        init: function() {},
                        addEventListener: function() {},
                        button: function() {},
                        counter: function() {},
                        update: function() {},
                        toolbox: function() {},
                        layers: function() {}
                    };
                    Object.defineProperty(Window.prototype.toString, "ba82b6651325f357520ba8af3cd8a9cc", {
                        value: t,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (t) {
                console.error('Error executing AG js rule with uniqueId "ba82b6651325f357520ba8af3cd8a9cc" due to: ' + t);
            }
        }
    },
    "twttr={events: { bind: function() {} }};": {
        uniqueId: "14a0dfcfc56570b45c7aa35014affd67",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["14a0dfcfc56570b45c7aa35014affd67"] !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "14a0dfcfc56570b45c7aa35014affd67" due to: ' + e);
            }
        }
    },
    "!function(){window.somtag={cmd:function(){}};}();": {
        uniqueId: "54ae50f5a5c3a82be06ee24cd3c05183",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["54ae50f5a5c3a82be06ee24cd3c05183"] !== e) {
                    window.somtag = {
                        cmd: function() {}
                    };
                    Object.defineProperty(Window.prototype.toString, "54ae50f5a5c3a82be06ee24cd3c05183", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "54ae50f5a5c3a82be06ee24cd3c05183" due to: ' + e);
            }
        }
    },
    "window.werbeblocker = true;": {
        uniqueId: "0f7c5eb1cea174c4baeb46ecd074e090",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["0f7c5eb1cea174c4baeb46ecd074e090"] !== e) {
                    window.werbeblocker = !0;
                    Object.defineProperty(Window.prototype.toString, "0f7c5eb1cea174c4baeb46ecd074e090", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "0f7c5eb1cea174c4baeb46ecd074e090" due to: ' + e);
            }
        }
    },
    "adet = false;": {
        uniqueId: "a44a6107aec5ff60e35ccabb1052df4d",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.a44a6107aec5ff60e35ccabb1052df4d !== e) {
                    adet = !1;
                    Object.defineProperty(Window.prototype.toString, "a44a6107aec5ff60e35ccabb1052df4d", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "a44a6107aec5ff60e35ccabb1052df4d" due to: ' + e);
            }
        }
    },
    '(()=>{const a=(a,b,c)=>{const d=Reflect.apply(a,b,c),e=".list-programmatic-ad-item--multi-line, .list-inbox-ad-item--multi-line { display: none !important; }";if("adoptedStyleSheets"in document){const a=new CSSStyleSheet;a.replaceSync(e),d.adoptedStyleSheets=[a]}else{const a=document.createElement("style");a.innerText=e,d.appendChild(a)}return d};window.Element.prototype.attachShadow=new Proxy(window.Element.prototype.attachShadow,{apply:a})})();': {
        uniqueId: "cf91ecb912e2bbad7423b9f79d6847f3",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.cf91ecb912e2bbad7423b9f79d6847f3 !== e) {
                    window.Element.prototype.attachShadow = new Proxy(window.Element.prototype.attachShadow, {
                        apply: (e, t, o) => {
                            const n = Reflect.apply(e, t, o), i = ".list-programmatic-ad-item--multi-line, .list-inbox-ad-item--multi-line { display: none !important; }";
                            if ("adoptedStyleSheets" in document) {
                                const e = new CSSStyleSheet;
                                e.replaceSync(i), n.adoptedStyleSheets = [ e ];
                            } else {
                                const e = document.createElement("style");
                                e.innerText = i, n.appendChild(e);
                            }
                            return n;
                        }
                    });
                    Object.defineProperty(Window.prototype.toString, "cf91ecb912e2bbad7423b9f79d6847f3", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "cf91ecb912e2bbad7423b9f79d6847f3" due to: ' + e);
            }
        }
    },
    "(()=>{const t={construct:(t,n,e)=>{const o=n[0],r=o?.toString();return r&&r.length>500&&r.length<1e3&&/=>[\\s\\S]*?for[\\s\\S]*?\\[.+\\]/.test(r)&&(n[0]=()=>{}),Reflect.construct(t,n,e)}};window.MutationObserver=new Proxy(window.MutationObserver,t)})();": {
        uniqueId: "c7d43d7f4bded61bedc6218a5f6b0727",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.c7d43d7f4bded61bedc6218a5f6b0727 !== e) {
                    (() => {
                        const e = {
                            construct: (e, t, o) => {
                                const r = t[0], n = r?.toString();
                                return n && n.length > 500 && n.length < 1e3 && /=>[\s\S]*?for[\s\S]*?\[.+\]/.test(n) && (t[0] = () => {}), 
                                Reflect.construct(e, t, o);
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "c7d43d7f4bded61bedc6218a5f6b0727" due to: ' + e);
            }
        }
    },
    "(()=>{document.addEventListener('DOMContentLoaded',()=>{const o=[];[...document.scripts].forEach((c=>{const n=c.innerText,t=/window\\..*\\[\"(.*)\"]/;if(n.includes('\"impr\":')){const c=n.match(t)[1];o.push(c)}})),o.forEach((o=>{const c=document.querySelector(`.${o}`);c&&c.remove()}))})})();": {
        uniqueId: "457e0165e3e3728dbee48f0406d58268",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["457e0165e3e3728dbee48f0406d58268"] !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "457e0165e3e3728dbee48f0406d58268" due to: ' + e);
            }
        }
    },
    '(()=>{window.XMLHttpRequest.prototype.send=new Proxy(window.XMLHttpRequest.prototype.send,{apply:(a,b,c)=>{const d=b.urlCalled;return"string"!=typeof d||0===d.length?Reflect.apply(a,b,c):d.match(/\\.damoh\\./)?void 0:Reflect.apply(a,b,c)}})})();': {
        uniqueId: "cc36ce7238df0916503c980264bdfe26",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.cc36ce7238df0916503c980264bdfe26 !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "cc36ce7238df0916503c980264bdfe26" due to: ' + e);
            }
        }
    },
    '!function(){var n={cmd:[],public:{getVideoAdUrl:function(){},createNewPosition:function(){},refreshAds:function(){},setTargetingOnPosition:function(){},getDailymotionAdsParamsForScript:function(n,t){if("function"==typeof t)try{1===t.length&&t({preroll:"moviepilot"})}catch(t){}},setConfig:function(){},loadPositions:function(){},displayPositions:function(){}}};n.cmd.push=function(n){let t=function(){try{"function"==typeof n&&n()}catch(n){}};"complete"===document.readyState?t():window.addEventListener("load",(()=>{t()}))},window.jad=n}();': {
        uniqueId: "f1c7875f7971c5540a49992dc8a2bd9e",
        func: () => {
            try {
                const t = "done";
                if (Window.prototype.toString.f1c7875f7971c5540a49992dc8a2bd9e !== t) {
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
                }
            } catch (t) {
                console.error('Error executing AG js rule with uniqueId "f1c7875f7971c5540a49992dc8a2bd9e" due to: ' + t);
            }
        }
    },
    'var st = ".sidebar > div.widget-container:first-of-type, .sidebar > a[href^=\\"http://future-sale-system.de\\"], #messageList > li.message:not([id]), .sidebar > a[target=\\"_blank\\"] > img {display: none!important; }", a=document.createElement("style");a.type="text/css";a.styleSheet?a.styleSheet.cssText=st:a.innerHTML=st;document.getElementsByTagName("head")[0].appendChild(a);': {
        uniqueId: "d5fec51f23abfe393fc62b4a6d96a44b",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.d5fec51f23abfe393fc62b4a6d96a44b !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "d5fec51f23abfe393fc62b4a6d96a44b" due to: ' + e);
            }
        }
    },
    "window.disablePopUnder = true;": {
        uniqueId: "b80435e9460675a80ec183f27eb50cbf",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.b80435e9460675a80ec183f27eb50cbf !== e) {
                    window.disablePopUnder = !0;
                    Object.defineProperty(Window.prototype.toString, "b80435e9460675a80ec183f27eb50cbf", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "b80435e9460675a80ec183f27eb50cbf" due to: ' + e);
            }
        }
    },
    "var originalUserAgent = navigator.userAgent; Object.defineProperty(navigator, 'userAgent', { get: function() { return originalUserAgent + ' Edge'; } });": {
        uniqueId: "c3123d07eda7051ae1561c7613cf6cd8",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.c3123d07eda7051ae1561c7613cf6cd8 !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "c3123d07eda7051ae1561c7613cf6cd8" due to: ' + e);
            }
        }
    },
    'setTimeout(function(){var el = document.querySelector(".showitxt"); if(el) { el.innerHTML = el.innerHTML.replace("(Anzeige)",""); }},3000);': {
        uniqueId: "97deeafd5b9c8767a31890baf15c37ce",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["97deeafd5b9c8767a31890baf15c37ce"] !== e) {
                    setTimeout((function() {
                        var e = document.querySelector(".showitxt");
                        e && (e.innerHTML = e.innerHTML.replace("(Anzeige)", ""));
                    }), 3e3);
                    Object.defineProperty(Window.prototype.toString, "97deeafd5b9c8767a31890baf15c37ce", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "97deeafd5b9c8767a31890baf15c37ce" due to: ' + e);
            }
        }
    },
    '(function(b,d,e){function a(){}b={get:function(){return a},set:a},d={};Object.defineProperties(d,{spid_control_callback:b,content_control_callback:b,vid_control_callback:b});e=new Proxy({},{get:function(a,c){switch(c){case "config":return d;case "_setSpKey":throw Error();default:return a[c]}},set:function(a,c,b){switch(c){case "config":return!0;case "bootstrap":case "mms":return a[c]=b,!0;default:throw Error();}}});Object.defineProperty(window,"_sp_",{get:function(){return e},set:a})})();': {
        uniqueId: "cc4cbb964104e3ca9c968d0801cc2a98",
        func: () => {
            try {
                const c = "done";
                if (Window.prototype.toString.cc4cbb964104e3ca9c968d0801cc2a98 !== c) {
                    !function(c, e, t) {
                        function r() {}
                        c = {
                            get: function() {
                                return r;
                            },
                            set: r
                        }, e = {};
                        Object.defineProperties(e, {
                            spid_control_callback: c,
                            content_control_callback: c,
                            vid_control_callback: c
                        });
                        t = new Proxy({}, {
                            get: function(c, t) {
                                switch (t) {
                                  case "config":
                                    return e;

                                  case "_setSpKey":
                                    throw Error();

                                  default:
                                    return c[t];
                                }
                            },
                            set: function(c, e, t) {
                                switch (e) {
                                  case "config":
                                    return !0;

                                  case "bootstrap":
                                  case "mms":
                                    return c[e] = t, !0;

                                  default:
                                    throw Error();
                                }
                            }
                        });
                        Object.defineProperty(window, "_sp_", {
                            get: function() {
                                return t;
                            },
                            set: r
                        });
                    }();
                    Object.defineProperty(Window.prototype.toString, "cc4cbb964104e3ca9c968d0801cc2a98", {
                        value: c,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (c) {
                console.error('Error executing AG js rule with uniqueId "cc4cbb964104e3ca9c968d0801cc2a98" due to: ' + c);
            }
        }
    },
    '(()=>{let e=[];document.addEventListener("DOMContentLoaded",(()=>{const t=document.querySelector("body script").textContent.match(/"] = \'(.*?)\'/g);if(!t)return;t.forEach((t=>{const r=t.replace(/.*\'(.*?)\'/,"$1");e.push(r)}));const r=document.querySelector(\'.dl_button[href*="preview"]\').href.split("?")[1];e.includes(r)&&(e=e.filter((e=>e!==r)));document.querySelectorAll(".dl_button[href]").forEach((t=>{let r=t.cloneNode(!0);r.href=t.href.replace(/\\?.*/,`?${e[0]}`),t.after(r);let o=t.cloneNode(!0);o.href=t.href.replace(/\\?.*/,`?${e[1]}`),t.after(o)}))}))})();': {
        uniqueId: "dd2ab3ea1b069f5b262d0c2924b695ca",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.dd2ab3ea1b069f5b262d0c2924b695ca !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "dd2ab3ea1b069f5b262d0c2924b695ca" due to: ' + e);
            }
        }
    },
    '!function(){const o={apply:(o,n,r)=>(new Error).stack.includes("refreshad")?0:Reflect.apply(o,n,r)};window.Math.floor=new Proxy(window.Math.floor,o)}();': {
        uniqueId: "aac06a0fe043d0b0021afeae4330a5d5",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.aac06a0fe043d0b0021afeae4330a5d5 !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "aac06a0fe043d0b0021afeae4330a5d5" due to: ' + e);
            }
        }
    },
    '(function(){const a=Function.prototype.toString;window.EventTarget.prototype.addEventListener=new Proxy(window.EventTarget.prototype.addEventListener,{apply:(b,c,d)=>{const e=d[1],f=/detail.adblockDetected|handleAdblockDetect|Flags.autoRecov/;return e&&"function"==typeof e&&(f.test(a.call(e))||f.test(e.toString()))&&(d[1]=function(){}),Reflect.apply(b,c,d)}});Function.prototype.bind=new Proxy(Function.prototype.bind,{apply:(b,c,d)=>{const e=a.call(c),f=Reflect.apply(b,c,d);return f.toString=function(){return e},f}})})();': {
        uniqueId: "e33ef1a5a53f3c2f5bbed2ef8c665146",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.e33ef1a5a53f3c2f5bbed2ef8c665146 !== e) {
                    !function() {
                        const e = Function.prototype.toString;
                        window.EventTarget.prototype.addEventListener = new Proxy(window.EventTarget.prototype.addEventListener, {
                            apply: (t, o, n) => {
                                const r = n[1], c = /detail.adblockDetected|handleAdblockDetect|Flags.autoRecov/;
                                return r && "function" == typeof r && (c.test(e.call(r)) || c.test(r.toString())) && (n[1] = function() {}), 
                                Reflect.apply(t, o, n);
                            }
                        });
                        Function.prototype.bind = new Proxy(Function.prototype.bind, {
                            apply: (t, o, n) => {
                                const r = e.call(o), c = Reflect.apply(t, o, n);
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "e33ef1a5a53f3c2f5bbed2ef8c665146" due to: ' + e);
            }
        }
    },
    '!function(){var t={cmd:[],public:{getVideoAdUrl:function(){},createNewPosition:function(){},refreshAds:function(){},setTargetingOnPosition:function(){},getDailymotionAdsParamsForScript:function(t,n){if("function"==typeof n)try{if(1===n.length){const o=t[0];n({[o]:o})}}catch(n){console.debug(n)}}}};t.cmd.push=function(t){let n=function(){try{"function"==typeof t&&t()}catch(t){}};"complete"===document.readyState?n():window.addEventListener("load",(()=>{n()}))},window.jad=t}();': {
        uniqueId: "4b02efce565c43abd97593b12856ccd8",
        func: () => {
            try {
                const t = "done";
                if (Window.prototype.toString["4b02efce565c43abd97593b12856ccd8"] !== t) {
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
                }
            } catch (t) {
                console.error('Error executing AG js rule with uniqueId "4b02efce565c43abd97593b12856ccd8" due to: ' + t);
            }
        }
    },
    '(function(){if(-1<window.location.href.indexOf("/s.php?i="))try{for(var a=location.href.split("/s.php?i=")[1],c=0;10>c;c++){a=atob(a);try{new URL(a);var d=!0}catch(b){d=!1}if(d)try{a=a.replace(/[a-zA-Z]/g,function(b){return String.fromCharCode(("Z">=b?90:122)>=(b=b.charCodeAt(0)+13)?b:b-26)});a=decodeURIComponent(a);window.location=a;break}catch(b){}}}catch(b){}})();': {
        uniqueId: "2df496ddbea99bcffb94b9b433cac64d",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["2df496ddbea99bcffb94b9b433cac64d"] !== e) {
                    !function() {
                        if (-1 < window.location.href.indexOf("/s.php?i=")) try {
                            for (var e = location.href.split("/s.php?i=")[1], o = 0; 10 > o; o++) {
                                e = atob(e);
                                try {
                                    new URL(e);
                                    var t = !0;
                                } catch (e) {
                                    t = !1;
                                }
                                if (t) try {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "2df496ddbea99bcffb94b9b433cac64d" due to: ' + e);
            }
        }
    },
    '!function(){if(-1<window.location.href.indexOf("/#aHR0c")){var a=location.href.split("/#");if(a&&a[1])try{window.location=atob(a[1])}catch(b){}}}();': {
        uniqueId: "8b3aa220c71f03621cb9cd086eb59619",
        func: () => {
            try {
                const o = "done";
                if (Window.prototype.toString["8b3aa220c71f03621cb9cd086eb59619"] !== o) {
                    !function() {
                        if (-1 < window.location.href.indexOf("/#aHR0c")) {
                            var o = location.href.split("/#");
                            if (o && o[1]) try {
                                window.location = atob(o[1]);
                            } catch (o) {}
                        }
                    }();
                    Object.defineProperty(Window.prototype.toString, "8b3aa220c71f03621cb9cd086eb59619", {
                        value: o,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (o) {
                console.error('Error executing AG js rule with uniqueId "8b3aa220c71f03621cb9cd086eb59619" due to: ' + o);
            }
        }
    },
    '(function(){var b=XMLHttpRequest.prototype.open,c=/pagead2\\.googlesyndication\\.com/i;XMLHttpRequest.prototype.open=function(d,a){if("GET"===d&&c.test(a))this.send=function(){return null},this.setRequestHeader=function(){return null},console.log("AG has blocked request: ",a);else return b.apply(this,arguments)}})();': {
        uniqueId: "b56615f06c5a4f3d6dbd34cd41a23997",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.b56615f06c5a4f3d6dbd34cd41a23997 !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "b56615f06c5a4f3d6dbd34cd41a23997" due to: ' + e);
            }
        }
    },
    '(()=>{let e="";const t={adsbygoogle:{url:"//pagead2.googlesyndication.com/pagead/js/adsbygoogle.js",value:"google_plmetrics"},outbrain:{url:"//widgets.outbrain.com/outbrain.js",value:"outbrain"},cdnpcStyleMin:{url:"//s4.cdnpc.net/front/css/style.min.css",value:"slider--features"},cdnpcMain:{url:"//s4.cdnpc.net/vite-bundle/main.css",value:"data-v-d23a26c8"},taboola:{url:"//cdn.taboola.com/libtrc/san1go-network/loader.js",value:"feOffset"}},n=n=>{try{const o=n;if(!o.responseText){const n=(e=>{const n=Object.values(t).find((t=>e.includes(t.url)));return n?n.value:""})(e);Object.defineProperty(o,"responseText",{value:n})}"function"==typeof o.onload&&o.onload(),"function"==typeof o.onreadystatechange&&(Object.defineProperty(o,"status",{value:200}),Object.defineProperty(o,"readyState",{value:4}),o.onreadystatechange())}catch(e){console.trace(e)}},o={apply:(n,o,a)=>{const r=a[1];return r&&(e=>Object.values(t).some((t=>e.includes(t.url))))(r)&&(o.prevent=!0,e=r),Reflect.apply(n,o,a)}};window.XMLHttpRequest.prototype.open=new Proxy(window.XMLHttpRequest.prototype.open,o);const a={apply:async(t,o,a)=>{if(!o.prevent)return Reflect.apply(t,o,a);try{const t=await fetch(e);if((await t.text()).length<2e3)return n(o)}catch(e){return console.trace(e),n(o)}return Reflect.apply(t,o,a)}};window.XMLHttpRequest.prototype.send=new Proxy(window.XMLHttpRequest.prototype.send,a)})();': {
        uniqueId: "999651d762087524799a382abaeba96f",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["999651d762087524799a382abaeba96f"] !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "999651d762087524799a382abaeba96f" due to: ' + e);
            }
        }
    },
    "window.loadingAds = true;": {
        uniqueId: "92cb1336a3ae04946fb7472ef921e5a2",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["92cb1336a3ae04946fb7472ef921e5a2"] !== e) {
                    window.loadingAds = !0;
                    Object.defineProperty(Window.prototype.toString, "92cb1336a3ae04946fb7472ef921e5a2", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "92cb1336a3ae04946fb7472ef921e5a2" due to: ' + e);
            }
        }
    },
    "window.N3CanRunAds = true;": {
        uniqueId: "bf2528e3820489391dd14ff4e676bf77",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.bf2528e3820489391dd14ff4e676bf77 !== e) {
                    window.N3CanRunAds = !0;
                    Object.defineProperty(Window.prototype.toString, "bf2528e3820489391dd14ff4e676bf77", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "bf2528e3820489391dd14ff4e676bf77" due to: ' + e);
            }
        }
    },
    "window.UFads = true;": {
        uniqueId: "6f1638cef962ca7bcf9ae1cd4762f141",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["6f1638cef962ca7bcf9ae1cd4762f141"] !== e) {
                    window.UFads = !0;
                    Object.defineProperty(Window.prototype.toString, "6f1638cef962ca7bcf9ae1cd4762f141", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "6f1638cef962ca7bcf9ae1cd4762f141" due to: ' + e);
            }
        }
    },
    "window.pr_okvalida=true;": {
        uniqueId: "9cea5435efc0d37e874e0db2f82cafe5",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["9cea5435efc0d37e874e0db2f82cafe5"] !== e) {
                    window.pr_okvalida = !0;
                    Object.defineProperty(Window.prototype.toString, "9cea5435efc0d37e874e0db2f82cafe5", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "9cea5435efc0d37e874e0db2f82cafe5" due to: ' + e);
            }
        }
    },
    "window.pr_okAd = true;": {
        uniqueId: "a20a9b76443176de1d59662b7bec69ac",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.a20a9b76443176de1d59662b7bec69ac !== e) {
                    window.pr_okAd = !0;
                    Object.defineProperty(Window.prototype.toString, "a20a9b76443176de1d59662b7bec69ac", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "a20a9b76443176de1d59662b7bec69ac" due to: ' + e);
            }
        }
    },
    "window.adblockDetecter = true;": {
        uniqueId: "077ad96f9724037e5e50572b0e1dad20",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["077ad96f9724037e5e50572b0e1dad20"] !== e) {
                    window.adblockDetecter = !0;
                    Object.defineProperty(Window.prototype.toString, "077ad96f9724037e5e50572b0e1dad20", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "077ad96f9724037e5e50572b0e1dad20" due to: ' + e);
            }
        }
    },
    "window.pr_okvalida = true;": {
        uniqueId: "61d8c36d64bce12eddcaa6d5227fb569",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["61d8c36d64bce12eddcaa6d5227fb569"] !== e) {
                    window.pr_okvalida = !0;
                    Object.defineProperty(Window.prototype.toString, "61d8c36d64bce12eddcaa6d5227fb569", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "61d8c36d64bce12eddcaa6d5227fb569" due to: ' + e);
            }
        }
    },
    '(()=>{document.addEventListener("DOMContentLoaded",(()=>{try{let t;"function"==typeof decode_link&&"string"==typeof link_out&&(t=decode_link(atob(link_out)),location.assign(t)),"string"==typeof api_key&&(document.cookie=`${api_key}=Wn275; path=/`);const e=document.querySelector("* > .button#contador");e&&t&&setTimeout((()=>{const o=e.cloneNode(!0);e.parentNode.replaceChild(o,e),o.addEventListener("click",(function(){location.assign(t)}),!1)}),500)}catch(t){}}));})();': {
        uniqueId: "90c94b5e54df0c8bc3584e6dd04ae87a",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["90c94b5e54df0c8bc3584e6dd04ae87a"] !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "90c94b5e54df0c8bc3584e6dd04ae87a" due to: ' + e);
            }
        }
    },
    '(()=>{document.addEventListener("DOMContentLoaded",(()=>{document.querySelectorAll(\'.count > li > a[href*="/#!"]\').forEach((t=>{const e=(t=>{let e=t;for(let t=0;t<10;t++)try{e=atob(e)}catch(t){break}return e})(t.href.split("/#!")[1]);(t=>{let e=t;try{e=new URL(t)}catch(t){return!1}return"http:"===e.protocol||"https:"===e.protocol})(e)&&t.setAttribute("href",e)}))}));})();': {
        uniqueId: "b4e699f5dab66359b40b32542eea64c5",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.b4e699f5dab66359b40b32542eea64c5 !== e) {
                    document.addEventListener("DOMContentLoaded", (() => {
                        document.querySelectorAll('.count > li > a[href*="/#!"]').forEach((e => {
                            const t = (e => {
                                let t = e;
                                for (let r = 0; r < 10; r++) try {
                                    t = atob(t);
                                } catch (e) {
                                    break;
                                }
                                return t;
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
                    Object.defineProperty(Window.prototype.toString, "b4e699f5dab66359b40b32542eea64c5", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "b4e699f5dab66359b40b32542eea64c5" due to: ' + e);
            }
        }
    },
    '!function(){if(window.location.href.includes(".php?")&&window.location.href.includes("=")){const o=location.href.split("=");if(o&&o[1]){let t=o[1];for(let o=0;o<10;o++)try{t=atob(t)}catch(o){const n=decodeURIComponent(t);let c=!1;try{new URL(n),c=!0}catch(o){c=!1}if(c){location.assign(n);break}}}}}();': {
        uniqueId: "aed92a9e5fa43ee06d13ea0740f42251",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.aed92a9e5fa43ee06d13ea0740f42251 !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "aed92a9e5fa43ee06d13ea0740f42251" due to: ' + e);
            }
        }
    },
    '(function(){if(-1<window.location.href.indexOf("/#")){var b=location.href.split("/#");if(b&&b[1]){b=b[1];for(var f=0;10>f;f++)try{b=atob(b)}catch(a){var g=decodeURIComponent(b);g=g.split("&url=")[1];try{new URL(g);var h=!0}catch(a){h=!1}if(h){location.assign(g);break}}}}})();': {
        uniqueId: "e461bea6c1765b5004b1bdf45a657484",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.e461bea6c1765b5004b1bdf45a657484 !== e) {
                    !function() {
                        if (-1 < window.location.href.indexOf("/#")) {
                            var e = location.href.split("/#");
                            if (e && e[1]) {
                                e = e[1];
                                for (var o = 0; 10 > o; o++) try {
                                    e = atob(e);
                                } catch (o) {
                                    var t = decodeURIComponent(e);
                                    t = t.split("&url=")[1];
                                    try {
                                        new URL(t);
                                        var r = !0;
                                    } catch (e) {
                                        r = !1;
                                    }
                                    if (r) {
                                        location.assign(t);
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "e461bea6c1765b5004b1bdf45a657484" due to: ' + e);
            }
        }
    },
    '(function(){if(-1<window.location.href.indexOf("/#")){var b=location.href.split("/#");if(b&&b[1]){b=b[1];for(var f=0;10>f;f++)try{b=atob(b)}catch(a){var g=decodeURIComponent(b);try{new URL(g);var h=!0}catch(a){h=!1}if(h){location.assign(g);break}}}}})();': {
        uniqueId: "9b5e9479cf0e6f4ce35ed63d4353bab4",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["9b5e9479cf0e6f4ce35ed63d4353bab4"] !== e) {
                    !function() {
                        if (-1 < window.location.href.indexOf("/#")) {
                            var e = location.href.split("/#");
                            if (e && e[1]) {
                                e = e[1];
                                for (var o = 0; 10 > o; o++) try {
                                    e = atob(e);
                                } catch (o) {
                                    var t = decodeURIComponent(e);
                                    try {
                                        new URL(t);
                                        var r = !0;
                                    } catch (e) {
                                        r = !1;
                                    }
                                    if (r) {
                                        location.assign(t);
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "9b5e9479cf0e6f4ce35ed63d4353bab4" due to: ' + e);
            }
        }
    },
    '(function(){if(-1<window.location.href.indexOf("/#!")){var b=location.href.split("/#!");if(b&&b[1]){b=b[1];for(var f=0;10>f;f++)try{b=atob(b)}catch(a){var g=decodeURIComponent(b);try{new URL(g);var h=!0}catch(a){h=!1}if(h){location.assign(g);break}}}}})();': {
        uniqueId: "06564135eca95acc020e6910b740c355",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["06564135eca95acc020e6910b740c355"] !== e) {
                    !function() {
                        if (-1 < window.location.href.indexOf("/#!")) {
                            var e = location.href.split("/#!");
                            if (e && e[1]) {
                                e = e[1];
                                for (var o = 0; 10 > o; o++) try {
                                    e = atob(e);
                                } catch (o) {
                                    var c = decodeURIComponent(e);
                                    try {
                                        new URL(c);
                                        var t = !0;
                                    } catch (e) {
                                        t = !1;
                                    }
                                    if (t) {
                                        location.assign(c);
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "06564135eca95acc020e6910b740c355" due to: ' + e);
            }
        }
    },
    '(function(){if(-1<window.location.href.indexOf("o.php?l=")){var b=location.href.split("o.php?l=");if(b&&b[1]){b=b[1].replace(/\\|\\d/,\'\');for(var f=0;10>f;f++)try{b=atob(b)}catch(a){var g=decodeURIComponent(b);try{new URL(g);var h=!0}catch(a){h=!1}if(h){location.assign(g);break}}}}})();': {
        uniqueId: "7236b4fca7e3b34846de4af64f512064",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["7236b4fca7e3b34846de4af64f512064"] !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "7236b4fca7e3b34846de4af64f512064" due to: ' + e);
            }
        }
    },
    '(()=>{document.addEventListener("DOMContentLoaded",(()=>{try{"function"==typeof window.noobBypass&&noobBypass()}catch(b){}}));})();': {
        uniqueId: "cf094940c140bb6a8015c9e1f15490f1",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.cf094940c140bb6a8015c9e1f15490f1 !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "cf094940c140bb6a8015c9e1f15490f1" due to: ' + e);
            }
        }
    },
    '!function(){const e=e=>{const o=new XMLHttpRequest;o.open("POST","/check.php",!0),o.setRequestHeader("Content-type","application/x-www-form-urlencoded"),o.send("a");const t=atob(window.ext_site).replace(/[a-z]/gi,(e=>String.fromCharCode(e.charCodeAt(0)+(e.toLowerCase()<="m"?13:-13))));let n=e.replaceAll(\'\\\\"\',\'"\');n=n.replace("\'+ api_key+ \'",window.api_key),n=n.replace("\'+ link_out+ \\"",window.link_out),n=n.replace(/action="\'\\+ .*?\\+ \'"/,`action="${t}"`);var a;const i=(a=n,(new DOMParser).parseFromString(a,"text/html")).querySelector("form"),r=new FormData(i),c=new XMLHttpRequest;c.open("POST",t,!0),c.send(r),window.tab2=window,postMessage("_clicked_b",location.origin)},o={apply:(o,t,n)=>{if(n[1]&&n[1].includes("api_key")){const o=window.link_out,t=window.api_key,a=n[1].match(/window\\.open\\(.*?\\(atob\\(main_site\\)\\).*?("\\/.*\\.php\\?.*=").*?("&.*?=").*?(api_key),"view"/),i=a[1].replaceAll(\'"\',""),r=a[2].replaceAll(\'"\',""),c=n[1].match(/<form target=[\\s\\S]*?<\\/form>/)[0];if(n[1]=n[1].replace("window.location.href","var nulled"),n[1]=n[1].replace("window.open(f","location.assign(f"),n[1]=n[1].replace(/(parseInt\\(c\\.split\\("-"\\)\\[0\\]\\)<= 0).*?(\\)\\{)/,"$1$2"),o&&t&&i&&r&&c)try{"loading"===document.readyState?window.addEventListener("load",(()=>{e(c)}),{once:!0}):e(c)}catch(e){console.debug(e)}}return Reflect.apply(o,t,n)}};window.Function.prototype.constructor=new Proxy(window.Function.prototype.constructor,o)}();': {
        uniqueId: "fd77edacac830e016dc4109bc637175a",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.fd77edacac830e016dc4109bc637175a !== e) {
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
                            const c = (a = n, (new DOMParser).parseFromString(a, "text/html")).querySelector("form"), r = new FormData(c), i = new XMLHttpRequest;
                            i.open("POST", t, !0), i.send(r), window.tab2 = window, postMessage("_clicked_b", location.origin);
                        }, o = {
                            apply: (o, t, n) => {
                                if (n[1] && n[1].includes("api_key")) {
                                    const o = window.link_out, t = window.api_key, a = n[1].match(/window\.open\(.*?\(atob\(main_site\)\).*?("\/.*\.php\?.*=").*?("&.*?=").*?(api_key),"view"/), c = a[1].replaceAll('"', ""), r = a[2].replaceAll('"', ""), i = n[1].match(/<form target=[\s\S]*?<\/form>/)[0];
                                    if (n[1] = n[1].replace("window.location.href", "var nulled"), n[1] = n[1].replace("window.open(f", "location.assign(f"), 
                                    n[1] = n[1].replace(/(parseInt\(c\.split\("-"\)\[0\]\)<= 0).*?(\)\{)/, "$1$2"), 
                                    o && t && c && r && i) try {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "fd77edacac830e016dc4109bc637175a" due to: ' + e);
            }
        }
    },
    '(()=>{try{const o=location.href.split("/#");if(o[1]){let t=o[1];for(let o=0;o<10;o++)try{t=atob(t)}catch(o){break}const c=decodeURIComponent(t).split("&url=")[1];c&&location.assign(c)}}catch(o){console.error(o)}})();': {
        uniqueId: "665cc7cdf79cd8609ccd1c640a89ccd0",
        func: () => {
            try {
                const c = "done";
                if (Window.prototype.toString["665cc7cdf79cd8609ccd1c640a89ccd0"] !== c) {
                    (() => {
                        try {
                            const c = location.href.split("/#");
                            if (c[1]) {
                                let o = c[1];
                                for (let c = 0; c < 10; c++) try {
                                    o = atob(o);
                                } catch (c) {
                                    break;
                                }
                                const t = decodeURIComponent(o).split("&url=")[1];
                                t && location.assign(t);
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
                }
            } catch (c) {
                console.error('Error executing AG js rule with uniqueId "665cc7cdf79cd8609ccd1c640a89ccd0" due to: ' + c);
            }
        }
    },
    '(function(){try{var a=location.href.split("out#!");if(a[1]){a=a[1];for(var b=0;10>b;b++){a=atob(a);try{new URL(decodeURIComponent(a));var c=!0}catch(d){c=!1}if(c)try{location.assign(decodeURIComponent(a));break}catch(d){}}}}catch(d){}})();': {
        uniqueId: "a97c62453393267bb0f7c37f1de195be",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.a97c62453393267bb0f7c37f1de195be !== e) {
                    !function() {
                        try {
                            var e = location.href.split("out#!");
                            if (e[1]) {
                                e = e[1];
                                for (var o = 0; 10 > o; o++) {
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
                    Object.defineProperty(Window.prototype.toString, "a97c62453393267bb0f7c37f1de195be", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "a97c62453393267bb0f7c37f1de195be" due to: ' + e);
            }
        }
    },
    "(()=>{document.addEventListener('DOMContentLoaded',function(){if(window.deco_url_b64&&typeof deco_url_b64==='string'&&deco_url_b64.startsWith('http')){location.assign(deco_url_b64);}});})();": {
        uniqueId: "370c2e67375d1730dbabcd4586b41c96",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["370c2e67375d1730dbabcd4586b41c96"] !== e) {
                    document.addEventListener("DOMContentLoaded", (function() {
                        window.deco_url_b64 && "string" == typeof deco_url_b64 && deco_url_b64.startsWith("http") && location.assign(deco_url_b64);
                    }));
                    Object.defineProperty(Window.prototype.toString, "370c2e67375d1730dbabcd4586b41c96", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "370c2e67375d1730dbabcd4586b41c96" due to: ' + e);
            }
        }
    },
    '(function(){try{var a=location.href.split("#");if(a[1]){a=a[1];for(var b=0;10>b;b++){a=atob(a);try{new URL(decodeURIComponent(a));var c=!0}catch(d){c=!1}if(c)try{location.assign(decodeURIComponent(a));break}catch(d){}}}}catch(d){}})();': {
        uniqueId: "5c24323e179726bab950bb8e6732b33b",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["5c24323e179726bab950bb8e6732b33b"] !== e) {
                    !function() {
                        try {
                            var e = location.href.split("#");
                            if (e[1]) {
                                e = e[1];
                                for (var o = 0; 10 > o; o++) {
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
                    Object.defineProperty(Window.prototype.toString, "5c24323e179726bab950bb8e6732b33b", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "5c24323e179726bab950bb8e6732b33b" due to: ' + e);
            }
        }
    },
    '(()=>{window.addEventListener("message",(e=>{e?.data?.includes("__done__")&&e?.data?.length<9&&Object.defineProperty(e,"source",{value:""})}),!0);const e=new MutationObserver((()=>{document.querySelector("a.button#contador")&&(e.disconnect(),setTimeout((()=>{postMessage("__done__")}),100))}));e.observe(document,{childList:!0,subtree:!0})})();': {
        uniqueId: "340e5298fafdd8b74113e0fea4af6efa",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["340e5298fafdd8b74113e0fea4af6efa"] !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "340e5298fafdd8b74113e0fea4af6efa" due to: ' + e);
            }
        }
    },
    '(function(){if(-1<window.location.href.indexOf("/#")){var a=location.href.split("/#");if(a&&a[1]){a=a[1];for(var c=0;10>c;c++)try{a=atob(a)}catch(f){var d=a.replace(/[a-zA-Z]/g,function(b){return String.fromCharCode(("Z">=b?90:122)>=(b=b.charCodeAt(0)+13)?b:b-26)});try{new URL(d);var e=!0}catch(b){e=!1}if(e){window.location=d;break}}}}})();': {
        uniqueId: "3937ca8d5dd840aca311dfd69741ce6c",
        func: () => {
            try {
                const r = "done";
                if (Window.prototype.toString["3937ca8d5dd840aca311dfd69741ce6c"] !== r) {
                    !function() {
                        if (-1 < window.location.href.indexOf("/#")) {
                            var r = location.href.split("/#");
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
                    Object.defineProperty(Window.prototype.toString, "3937ca8d5dd840aca311dfd69741ce6c", {
                        value: r,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (r) {
                console.error('Error executing AG js rule with uniqueId "3937ca8d5dd840aca311dfd69741ce6c" due to: ' + r);
            }
        }
    },
    '(function(){if(-1<window.location.href.indexOf("s.php?i=")){var a=location.href.split("s.php?i=");if(a&&a[1]){a=a[1];for(var c=0;10>c;c++)try{a=atob(a)}catch(f){var d=a.replace(/[a-zA-Z]/g,function(b){return String.fromCharCode(("Z">=b?90:122)>=(b=b.charCodeAt(0)+13)?b:b-26)});try{new URL(d);var e=!0}catch(b){e=!1}if(e){window.location=d;break}}}}})();': {
        uniqueId: "c351c9c83ef852439382448ab0d1ad4a",
        func: () => {
            try {
                const r = "done";
                if (Window.prototype.toString.c351c9c83ef852439382448ab0d1ad4a !== r) {
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
                }
            } catch (r) {
                console.error('Error executing AG js rule with uniqueId "c351c9c83ef852439382448ab0d1ad4a" due to: ' + r);
            }
        }
    },
    "(function(){var b=window.setTimeout;window.setTimeout=function(a,c){if(!/\\(\\)>0x0\\)\\{fA=setTimeout\\(/.test(a.toString()))return b(a,c)};})();": {
        uniqueId: "acb1e5048f2d6e4f5da7f33333aa8ad4",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString.acb1e5048f2d6e4f5da7f33333aa8ad4 !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "acb1e5048f2d6e4f5da7f33333aa8ad4" due to: ' + e);
            }
        }
    },
    '!function(){let e=()=>{document.querySelector("#case-1-generichide > .test-banner1").style.width="200px"};"complete"===document.readyState?e():window.document.addEventListener("readystatechange",e)}();': {
        uniqueId: "08d18a5e02e0ff3dfa7a775c5b3836b8",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["08d18a5e02e0ff3dfa7a775c5b3836b8"] !== e) {
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
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "08d18a5e02e0ff3dfa7a775c5b3836b8" due to: ' + e);
            }
        }
    },
    "console.log(Date.now(), 'script rule is executed');": {
        uniqueId: "4d604df7a1e110b1d7ccc9f9142d531d",
        func: () => {
            try {
                const e = "done";
                if (Window.prototype.toString["4d604df7a1e110b1d7ccc9f9142d531d"] !== e) {
                    console.log(Date.now(), "script rule is executed");
                    Object.defineProperty(Window.prototype.toString, "4d604df7a1e110b1d7ccc9f9142d531d", {
                        value: e,
                        enumerable: !1,
                        writable: !1,
                        configurable: !1
                    });
                }
            } catch (e) {
                console.error('Error executing AG js rule with uniqueId "4d604df7a1e110b1d7ccc9f9142d531d" due to: ' + e);
            }
        }
    }
};