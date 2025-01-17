/**
 * By the rules of Chrome Web Store, we cannot use remote scripts (and our JS and Scriptlet rules can be counted as such).
 *    Because of that, we use the following approach
 *    (you can search the described steps by 'JS_RULES_EXECUTION' in the bundled background.js):
 *
 * 1. We collect and pre-build JS and Scriptlet rules from the filters (which are pre-built into the extension)
 *    into the add-on (STEP 1.1 and 1.2). See 'updateLocalResourcesForChromiumMv3' in
 *    https://github.com/AdguardTeam/AdguardBrowserExtension/blob/release/mv3-filters/tools/resources/update-local-script-rules.ts
 *    and the files called "local_script_rules.js" and "local_scriptlet_rules.js".
 * 2. Collected local script and scriptlet rules are passed to the engine (STEP 2.1 and 2.2).
 * 3. At runtime we check every JS or Scriptlet rule (separately)
 *    whether it is included in "local_script_rules.js" or "local_scriptlet_rules.js" (STEP 3).
 * 4. Execution of JS and Scriptlet rules:
 *     - If the rule is included, we allow this rule to work since it is pre-built.
 *       Such rules are executed by chrome.scripting API (STEP 4.1 and 4.2). Other rules are discarded.
 */
export const localScriptRules = {
    '(function(){var a=document.currentScript,b=String.prototype.charCodeAt,c=function(){return true;};Object.defineProperty(String.prototype,"charCodeAt",{get:function(){return document.currentScript===a?b:c},set:function(a){}})})();': () => {
        try {
            !function() {
                var t = document.currentScript, r = String.prototype.charCodeAt, e = function() {
                    return !0;
                };
                Object.defineProperty(String.prototype, "charCodeAt", {
                    get: function() {
                        return document.currentScript === t ? r : e;
                    },
                    set: function(t) {}
                });
            }();
        } catch (t) {
            console.error("Error executing AG js: " + t);
        }
    },
    "(function() { var isSet = false; Object.defineProperty(window, 'vas', { get: function() { return isSet ? false : undefined; }, set: function() { isSet = false; } }); })();": () => {
        try {
            !function() {
                var r = !1;
                Object.defineProperty(window, "vas", {
                    get: function() {
                        return !r && void 0;
                    },
                    set: function() {
                        r = !1;
                    }
                });
            }();
        } catch (r) {
            console.error("Error executing AG js: " + r);
        }
    },
    "window.trckd = true;": () => {
        try {
            window.trckd = !0;
        } catch (r) {
            console.error("Error executing AG js: " + r);
        }
    },
    "window.ab = false;": () => {
        try {
            window.ab = !1;
        } catch (r) {
            console.error("Error executing AG js: " + r);
        }
    },
    "window.aadnet = {};": () => {
        try {
            window.aadnet = {};
        } catch (r) {
            console.error("Error executing AG js: " + r);
        }
    },
    "var isadblock=1;": () => {
        try {
            var isadblock = 1;
        } catch (r) {
            console.error("Error executing AG js: " + r);
        }
    },
    "function setTimeout() {};": () => {
        try {
            function setTimeout() {}
        } catch (r) {
            console.error("Error executing AG js: " + r);
        }
    },
    "window.google_jobrunner = function() {};": () => {
        try {
            window.google_jobrunner = function() {};
        } catch (o) {
            console.error("Error executing AG js: " + o);
        }
    },
    "var block = false;": () => {
        try {
            var block = !1;
        } catch (r) {
            console.error("Error executing AG js: " + r);
        }
    },
    "window.setTimeout=function() {};": () => {
        try {
            window.setTimeout = function() {};
        } catch (o) {
            console.error("Error executing AG js: " + o);
        }
    },
    "var canRunAds = true;": () => {
        try {
            var canRunAds = !0;
        } catch (r) {
            console.error("Error executing AG js: " + r);
        }
    },
    "Element.prototype.attachShadow = function(){};": () => {
        try {
            Element.prototype.attachShadow = function() {};
        } catch (t) {
            console.error("Error executing AG js: " + t);
        }
    },
    "(function() { var isSet = false; Object.defineProperty(window, 'vPRinfiniteLoopOfChanges', { get: function() { return isSet ? false : undefined; }, set: function() { isSet = false; } }); })();": () => {
        try {
            !function() {
                var n = !1;
                Object.defineProperty(window, "vPRinfiniteLoopOfChanges", {
                    get: function() {
                        return !n && void 0;
                    },
                    set: function() {
                        n = !1;
                    }
                });
            }();
        } catch (n) {
            console.error("Error executing AG js: " + n);
        }
    },
    "window.atob = function() {};": () => {
        try {
            window.atob = function() {};
        } catch (o) {
            console.error("Error executing AG js: " + o);
        }
    },
    "window.Worker = function() { this.postMessage = function() {} };": () => {
        try {
            window.Worker = function() {
                this.postMessage = function() {};
            };
        } catch (o) {
            console.error("Error executing AG js: " + o);
        }
    },
    "(function() { var intervalId = 0; var blockAds = function() { try { if (typeof BeSeedRotator != 'undefined' && BeSeedRotator.Container.player) { clearInterval(intervalId); BeSeedRotator.showDismissButton(); BeSeedRotator.reCache(); } } catch (ex) {}  }; intervalId = setInterval(blockAds, 100); })();": () => {
        try {
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
        } catch (e) {
            console.error("Error executing AG js: " + e);
        }
    },
    '(function(){var getElementsByTagName=document.getElementsByTagName;document.getElementsByTagName=function(tagName){if(tagName=="script")return[];return getElementsByTagName.call(this,tagName)}})();': () => {
        try {
            !function() {
                var e = document.getElementsByTagName;
                document.getElementsByTagName = function(t) {
                    return "script" == t ? [] : e.call(this, t);
                };
            }();
        } catch (e) {
            console.error("Error executing AG js: " + e);
        }
    },
    '(function(){var b={};(function(a,c,d){"undefined"!==typeof window[a]?window[a][c]=d:Object.defineProperty(window,a,{get:function(){return b[a]},set:function(e){b[a]=e;e[c]=d}})})("authConfig","adfox",[])})();': () => {
        try {
            !function() {
                var n, o, r, t = {};
                n = "authConfig", o = "adfox", r = [], void 0 !== window[n] ? window[n][o] = r : Object.defineProperty(window, n, {
                    get: function() {
                        return t[n];
                    },
                    set: function(e) {
                        t[n] = e;
                        e[o] = r;
                    }
                });
            }();
        } catch (n) {
            console.error("Error executing AG js: " + n);
        }
    },
    '!function(){const p={apply:(p,e,n)=>{const r=Reflect.apply(p,e,n),s=r?.[0]?.props?.data;return s&&null===s.user&&(r[0].props.data.user="guest"),r}};window.JSON.parse=new Proxy(window.JSON.parse,p)}();': () => {
        try {
            !function() {
                const r = {
                    apply: (r, e, o) => {
                        const n = Reflect.apply(r, e, o), s = n?.[0]?.props?.data;
                        return s && null === s.user && (n[0].props.data.user = "guest"), n;
                    }
                };
                window.JSON.parse = new Proxy(window.JSON.parse, r);
            }();
        } catch (r) {
            console.error("Error executing AG js: " + r);
        }
    },
    '(()=>{const a=(a,b,c)=>{const d=Reflect.apply(a,b,c),e="div[id^=\'atf\']:empty { display: none !important; }";if("adoptedStyleSheets"in document){const a=new CSSStyleSheet;a.replaceSync(e),d.adoptedStyleSheets=[a]}else{const a=document.createElement("style");a.innerText=e,d.appendChild(a)}return d};window.Element.prototype.attachShadow=new Proxy(window.Element.prototype.attachShadow,{apply:a})})();': () => {
        try {
            window.Element.prototype.attachShadow = new Proxy(window.Element.prototype.attachShadow, {
                apply: (e, t, n) => {
                    const o = Reflect.apply(e, t, n), a = "div[id^='atf']:empty { display: none !important; }";
                    if ("adoptedStyleSheets" in document) {
                        const e = new CSSStyleSheet;
                        e.replaceSync(a), o.adoptedStyleSheets = [ e ];
                    } else {
                        const e = document.createElement("style");
                        e.innerText = a, o.appendChild(e);
                    }
                    return o;
                }
            });
        } catch (e) {
            console.error("Error executing AG js: " + e);
        }
    },
    '(()=>{let e="";const a=`GA1.1.${Math.floor(Date.now()/1e3)}.${Math.floor(Date.now()/1e3)}`;let o=!1;const t=()=>{e=e.replace("G-",""),document.cookie=`_ga_${e}=${a}`};window.dataLayer=window.dataLayer||[],dataLayer.push=new Proxy(window.dataLayer.push,{apply:(a,d,n)=>("config"===n[0][0]&&(e=n[0][1],"complete"===document.readyState?t():o||(window.addEventListener("load",t),o=!0)),Reflect.apply(a,d,n))})})();': () => {
        try {
            (() => {
                let e = "";
                const a = `GA1.1.${Math.floor(Date.now() / 1e3)}.${Math.floor(Date.now() / 1e3)}`;
                let o = !1;
                const t = () => {
                    e = e.replace("G-", ""), document.cookie = `_ga_${e}=${a}`;
                };
                window.dataLayer = window.dataLayer || [], dataLayer.push = new Proxy(window.dataLayer.push, {
                    apply: (a, r, n) => ("config" === n[0][0] && (e = n[0][1], "complete" === document.readyState ? t() : o || (window.addEventListener("load", t), 
                    o = !0)), Reflect.apply(a, r, n))
                });
            })();
        } catch (e) {
            console.error("Error executing AG js: " + e);
        }
    },
    "window.samDetected = false;": () => {
        try {
            window.samDetected = !1;
        } catch (e) {
            console.error("Error executing AG js: " + e);
        }
    },
    "var _amw1 = 1;": () => {
        try {
            var _amw1 = 1;
        } catch (r) {
            console.error("Error executing AG js: " + r);
        }
    },
    "var AdmostClient = 1;": () => {
        try {
            var AdmostClient = 1;
        } catch (r) {
            console.error("Error executing AG js: " + r);
        }
    },
    "var advertisement_not_blocked = 1;": () => {
        try {
            var advertisement_not_blocked = 1;
        } catch (r) {
            console.error("Error executing AG js: " + r);
        }
    },
    "var criteo_medyanet_loaded = 1;": () => {
        try {
            var criteo_medyanet_loaded = 1;
        } catch (r) {
            console.error("Error executing AG js: " + r);
        }
    },
    '(function(){var b=window.setTimeout;window.setTimeout=function(a,c){if(!/RTCPeerConnection[\\s\\S]*?new MouseEvent\\("click"/.test(a.toString()))return b(a,c)};})();': () => {
        try {
            !function() {
                var e = window.setTimeout;
                window.setTimeout = function(t, n) {
                    if (!/RTCPeerConnection[\s\S]*?new MouseEvent\("click"/.test(t.toString())) return e(t, n);
                };
            }();
        } catch (e) {
            console.error("Error executing AG js: " + e);
        }
    },
    '!function(){if(-1<window.location.href.indexOf("/?u=aHR0c")){var a=location.href.split("/?u=");if(a[1])try{window.location=atob(a[1])}catch(b){}}}();': () => {
        try {
            !function() {
                if (-1 < window.location.href.indexOf("/?u=aHR0c")) {
                    var o = location.href.split("/?u=");
                    if (o[1]) try {
                        window.location = atob(o[1]);
                    } catch (o) {}
                }
            }();
        } catch (o) {
            console.error("Error executing AG js: " + o);
        }
    },
    'document.cookie="modalads=yes; path=/;";': () => {
        try {
            document.cookie = "modalads=yes; path=/;";
        } catch (o) {
            console.error("Error executing AG js: " + o);
        }
    },
    "if(window.sessionStorage) { window.sessionStorage.pageCount = 0; }": () => {
        try {
            window.sessionStorage && (window.sessionStorage.pageCount = 0);
        } catch (o) {
            console.error("Error executing AG js: " + o);
        }
    },
    'setTimeout ("HideFloatAdBanner()", 1000);': () => {
        try {
            setTimeout("HideFloatAdBanner()", 1e3);
        } catch (e) {
            console.error("Error executing AG js: " + e);
        }
    },
    '!function(){const e={apply:(e,t,n)=>(n&&n[1]&&"useAdBlockerDetector"===n[1]&&n[2]&&n[2].get&&(n[2].get=function(){return function(){return!1}}),Reflect.apply(e,t,n))};window.Object.defineProperty=new Proxy(window.Object.defineProperty,e)}();': () => {
        try {
            !function() {
                const e = {
                    apply: (e, r, t) => (t && t[1] && "useAdBlockerDetector" === t[1] && t[2] && t[2].get && (t[2].get = function() {
                        return function() {
                            return !1;
                        };
                    }), Reflect.apply(e, r, t))
                };
                window.Object.defineProperty = new Proxy(window.Object.defineProperty, e);
            }();
        } catch (e) {
            console.error("Error executing AG js: " + e);
        }
    },
    "window.google_tag_manager = function() {};": () => {
        try {
            window.google_tag_manager = function() {};
        } catch (o) {
            console.error("Error executing AG js: " + o);
        }
    },
    '(()=>{window.TATM=window.TATM||{},TATM.init=()=>{},TATM.initAdUnits=()=>{},TATM.pageReady=()=>{},TATM.getVast=function(n){return new Promise((n=>{n()}))},TATM.push=function(n){if("function"==typeof n)try{n()}catch(n){console.debug(n)}};})();': () => {
        try {
            window.TATM = window.TATM || {}, TATM.init = () => {}, TATM.initAdUnits = () => {}, 
            TATM.pageReady = () => {}, TATM.getVast = function(n) {
                return new Promise((n => {
                    n();
                }));
            }, TATM.push = function(n) {
                if ("function" == typeof n) try {
                    n();
                } catch (n) {
                    console.debug(n);
                }
            };
        } catch (n) {
            console.error("Error executing AG js: " + n);
        }
    },
    '(()=>{document.location.href.includes("/pop_advisor")&&AG_onLoad((function(){const e=new CustomEvent("visibilitychange"),t=t=>{Object.defineProperty(t.view.top.document,"hidden",{value:!0,writable:!0}),t.view.top.document.dispatchEvent(e),setTimeout((()=>{Object.defineProperty(t.view.top.document,"hidden",{value:!1,writable:!0}),t.view.top.document.dispatchEvent(e)}),100)},n=document.querySelector("button.btn-continu");n&&n.addEventListener("click",t)}));})();': () => {
        try {
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
        } catch (e) {
            console.error("Error executing AG js: " + e);
        }
    },
    '(function(){var a={cmd:[],public:{getVideoAdUrl:function(){},createNewPosition:function(){},refreshAds:function(){},setTargetingOnPosition:function(){},getDailymotionAdsParamsForScript:function(c,a){if("function"==typeof a)try{if(1===a.length){a({})}}catch(a){}}}};a.cmd.push=function(b){let a=function(){try{"function"==typeof b&&b()}catch(a){}};"complete"===document.readyState?a():window.addEventListener("load",()=>{a()})},window.jad=a})();': () => {
        try {
            !function() {
                var t = {
                    cmd: [],
                    public: {
                        getVideoAdUrl: function() {},
                        createNewPosition: function() {},
                        refreshAds: function() {},
                        setTargetingOnPosition: function() {},
                        getDailymotionAdsParamsForScript: function(t, n) {
                            if ("function" == typeof n) try {
                                1 === n.length && n({});
                            } catch (n) {}
                        }
                    }
                };
                t.cmd.push = function(t) {
                    let n = function() {
                        try {
                            "function" == typeof t && t();
                        } catch (t) {}
                    };
                    "complete" === document.readyState ? n() : window.addEventListener("load", (() => {
                        n();
                    }));
                }, window.jad = t;
            }();
        } catch (t) {
            console.error("Error executing AG js: " + t);
        }
    },
    "var _st = window.setTimeout; window.setTimeout = function(a, b) { if(!/target_url/.test(a)){ _st(a,b);}};": () => {
        try {
            var _st = window.setTimeout;
            window.setTimeout = function(t, e) {
                /target_url/.test(t) || _st(t, e);
            };
        } catch (t) {
            console.error("Error executing AG js: " + t);
        }
    },
    '(function(){let callCounter=0;const nativeJSONParse=JSON.parse;const handler={apply(){callCounter++;const obj=Reflect.apply(...arguments);if(callCounter<=10){if(obj.hasOwnProperty("appName")){if(obj.applaunch?.data?.player?.features?.ad?.enabled){obj.applaunch.data.player.features.ad.enabled=false}if(obj.applaunch?.data?.player?.features?.ad?.dai?.enabled){obj.applaunch.data.player.features.ad.dai.enabled=false}}}else{JSON.parse=nativeJSONParse}return obj}};JSON.parse=new Proxy(JSON.parse,handler)})();': () => {
        try {
            !function() {
                let a = 0;
                const e = JSON.parse, r = {
                    apply() {
                        a++;
                        const r = Reflect.apply(...arguments);
                        if (a <= 10) {
                            if (r.hasOwnProperty("appName")) {
                                r.applaunch?.data?.player?.features?.ad?.enabled && (r.applaunch.data.player.features.ad.enabled = !1);
                                r.applaunch?.data?.player?.features?.ad?.dai?.enabled && (r.applaunch.data.player.features.ad.dai.enabled = !1);
                            }
                        } else JSON.parse = e;
                        return r;
                    }
                };
                JSON.parse = new Proxy(JSON.parse, r);
            }();
        } catch (a) {
            console.error("Error executing AG js: " + a);
        }
    },
    "(function(){let callCounter=0;const nativeJSONParse=JSON.parse;const handler={apply(){callCounter++;const obj=Reflect.apply(...arguments);if(callCounter<=10){if(obj.hasOwnProperty('env')&&obj.env.hasOwnProperty('origin')){if(!obj.hasOwnProperty('ads')){obj.ads={};}obj.ads.enable=false;obj.ads._prerolls=false;obj.ads._midrolls=false;}}else{JSON.parse=nativeJSONParse;}return obj;}};JSON.parse=new Proxy(JSON.parse,handler);})();": () => {
        try {
            !function() {
                let r = 0;
                const e = JSON.parse, s = {
                    apply() {
                        r++;
                        const s = Reflect.apply(...arguments);
                        if (r <= 10) {
                            if (s.hasOwnProperty("env") && s.env.hasOwnProperty("origin")) {
                                s.hasOwnProperty("ads") || (s.ads = {});
                                s.ads.enable = !1;
                                s.ads._prerolls = !1;
                                s.ads._midrolls = !1;
                            }
                        } else JSON.parse = e;
                        return s;
                    }
                };
                JSON.parse = new Proxy(JSON.parse, s);
            }();
        } catch (r) {
            console.error("Error executing AG js: " + r);
        }
    },
    '(()=>{window.patroniteGdprData={google_recaptcha:"allow"}})();': () => {
        try {
            window.patroniteGdprData = {
                google_recaptcha: "allow"
            };
        } catch (r) {
            console.error("Error executing AG js: " + r);
        }
    },
    '(()=>{let t;const e=new MutationObserver(((e,o)=>{const n=t?.querySelector(\'button[data-testid="button-agree"]\');n&&(setTimeout((()=>{n.click()}),500),o.disconnect())})),o={apply:(o,n,c)=>{const a=Reflect.apply(o,n,c);return n.matches(".szn-cmp-dialog-container")&&(t=a),e.observe(a,{subtree:!0,childList:!0}),a}};window.Element.prototype.attachShadow=new Proxy(window.Element.prototype.attachShadow,o)})();': () => {
        try {
            (() => {
                let t;
                const e = new MutationObserver(((e, o) => {
                    const n = t?.querySelector('button[data-testid="button-agree"]');
                    n && (setTimeout((() => {
                        n.click();
                    }), 500), o.disconnect());
                })), o = {
                    apply: (o, n, r) => {
                        const c = Reflect.apply(o, n, r);
                        return n.matches(".szn-cmp-dialog-container") && (t = c), e.observe(c, {
                            subtree: !0,
                            childList: !0
                        }), c;
                    }
                };
                window.Element.prototype.attachShadow = new Proxy(window.Element.prototype.attachShadow, o);
            })();
        } catch (t) {
            console.error("Error executing AG js: " + t);
        }
    },
    '(function(){var noopFunc=function(){};var tcData={eventStatus:"tcloaded",gdprApplies:!1,listenerId:noopFunc,vendor:{consents:{967:true}},purpose:{consents:[]}};window.__tcfapi=function(command,version,callback){"function"==typeof callback&&"removeEventListener"!==command&&callback(tcData,!0)}})();': () => {
        try {
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
                window.__tcfapi = function(n, t, o) {
                    "function" == typeof o && "removeEventListener" !== n && o(e, !0);
                };
            }();
        } catch (e) {
            console.error("Error executing AG js: " + e);
        }
    },
    'document.cookie="PostAnalytics=inactive; path=/;";': () => {
        try {
            document.cookie = "PostAnalytics=inactive; path=/;";
        } catch (c) {
            console.error("Error executing AG js: " + c);
        }
    },
    "document.cookie='_s.cookie_consent=marketing=0:analytics=0:version=2021-07-01;path=/;';": () => {
        try {
            document.cookie = "_s.cookie_consent=marketing=0:analytics=0:version=2021-07-01;path=/;";
        } catch (o) {
            console.error("Error executing AG js: " + o);
        }
    },
    "document.cookie='cmplz_consented_services={\"youtube\":true};path=/;';": () => {
        try {
            document.cookie = 'cmplz_consented_services={"youtube":true};path=/;';
        } catch (e) {
            console.error("Error executing AG js: " + e);
        }
    },
    '(function(){if(!document.cookie.includes("CookieInformationConsent=")){var a=encodeURIComponent(\'{"website_uuid":"","timestamp":"","consent_url":"","consent_website":"jysk.nl","consent_domain":"jysk.nl","user_uid":"","consents_approved":["cookie_cat_necessary","cookie_cat_functional","cookie_cat_statistic"],"consents_denied":[],"user_agent":""}\');document.cookie="CookieInformationConsent="+a+"; path=/;"}})();': () => {
        try {
            !function() {
                if (!document.cookie.includes("CookieInformationConsent=")) {
                    var o = encodeURIComponent('{"website_uuid":"","timestamp":"","consent_url":"","consent_website":"jysk.nl","consent_domain":"jysk.nl","user_uid":"","consents_approved":["cookie_cat_necessary","cookie_cat_functional","cookie_cat_statistic"],"consents_denied":[],"user_agent":""}');
                    document.cookie = "CookieInformationConsent=" + o + "; path=/;";
                }
            }();
        } catch (o) {
            console.error("Error executing AG js: " + o);
        }
    },
    'document.cookie=\'cookie_consent_level={"functionality":true,"strictly-necessary":true,"targeting":false,"tracking":false}; path=/;\';': () => {
        try {
            document.cookie = 'cookie_consent_level={"functionality":true,"strictly-necessary":true,"targeting":false,"tracking":false}; path=/;';
        } catch (e) {
            console.error("Error executing AG js: " + e);
        }
    },
    '(function(){try{var a=location.pathname.split("/")[1],b="dra_cookie_consent_allowed_"+a,c=new RegExp(/[a-z]+_[a-z]+/);if(!document.cookie.includes(b)&&c.test(a)){var d=encodeURIComponent("v=1&t=1&f=1&s=0&m=0");document.cookie=b+"="+d+"; path=/;"}}catch(e){}})();': () => {
        try {
            !function() {
                try {
                    var o = location.pathname.split("/")[1], e = "dra_cookie_consent_allowed_" + o, t = new RegExp(/[a-z]+_[a-z]+/);
                    if (!document.cookie.includes(e) && t.test(o)) {
                        var c = encodeURIComponent("v=1&t=1&f=1&s=0&m=0");
                        document.cookie = e + "=" + c + "; path=/;";
                    }
                } catch (o) {}
            }();
        } catch (o) {
            console.error("Error executing AG js: " + o);
        }
    },
    'document.cookie="dw_cookies_accepted=D; path=/;";': () => {
        try {
            document.cookie = "dw_cookies_accepted=D; path=/;";
        } catch (c) {
            console.error("Error executing AG js: " + c);
        }
    },
    '(function(){document.cookie.includes("cookies-consents")||(document.cookie=\'cookies-consents={"ad_storage":false,"analytics_storage":false}\')})();': () => {
        try {
            document.cookie.includes("cookies-consents") || (document.cookie = 'cookies-consents={"ad_storage":false,"analytics_storage":false}');
        } catch (o) {
            console.error("Error executing AG js: " + o);
        }
    },
    'document.cookie="ubCmpSettings=eyJnZW1laW5kZW5fc2VsZWN0ZWRfdmFsdWUiOnRydWUsImdvb2dsZV9hbmFseXRpY3MiOmZhbHNlLCJhZF90cmFja2luZyI6ZmFsc2UsInNvY2lhbF9lbWJlZHMiOnRydWV9;path=/;";': () => {
        try {
            document.cookie = "ubCmpSettings=eyJnZW1laW5kZW5fc2VsZWN0ZWRfdmFsdWUiOnRydWUsImdvb2dsZV9hbmFseXRpY3MiOmZhbHNlLCJhZF90cmFja2luZyI6ZmFsc2UsInNvY2lhbF9lbWJlZHMiOnRydWV9;path=/;";
        } catch (s) {
            console.error("Error executing AG js: " + s);
        }
    },
    'document.cookie="cookieconsent_status=allow; path=/;";': () => {
        try {
            document.cookie = "cookieconsent_status=allow; path=/;";
        } catch (o) {
            console.error("Error executing AG js: " + o);
        }
    },
    'document.cookie="cookieConsentLevel=functional; path=/;";': () => {
        try {
            document.cookie = "cookieConsentLevel=functional; path=/;";
        } catch (o) {
            console.error("Error executing AG js: " + o);
        }
    },
    'document.cookie="cookies_accept=all; path=/;";': () => {
        try {
            document.cookie = "cookies_accept=all; path=/;";
        } catch (c) {
            console.error("Error executing AG js: " + c);
        }
    },
    'document.cookie="waconcookiemanagement=min; path=/;";': () => {
        try {
            document.cookie = "waconcookiemanagement=min; path=/;";
        } catch (o) {
            console.error("Error executing AG js: " + o);
        }
    },
    'document.cookie="apcAcceptedTrackingCookie3=1111000; path=/;";': () => {
        try {
            document.cookie = "apcAcceptedTrackingCookie3=1111000; path=/;";
        } catch (c) {
            console.error("Error executing AG js: " + c);
        }
    },
    'document.cookie="bbDatenstufe=stufe3; path=/;";': () => {
        try {
            document.cookie = "bbDatenstufe=stufe3; path=/;";
        } catch (e) {
            console.error("Error executing AG js: " + e);
        }
    },
    'document.cookie="newsletter-signup=viewed; path=/;";': () => {
        try {
            document.cookie = "newsletter-signup=viewed; path=/;";
        } catch (e) {
            console.error("Error executing AG js: " + e);
        }
    },
    'document.cookie="user_cookie_consent=essential; path=/";': () => {
        try {
            document.cookie = "user_cookie_consent=essential; path=/";
        } catch (e) {
            console.error("Error executing AG js: " + e);
        }
    },
    'document.cookie="cookiebanner=closed; path=/;";': () => {
        try {
            document.cookie = "cookiebanner=closed; path=/;";
        } catch (o) {
            console.error("Error executing AG js: " + o);
        }
    },
    'document.cookie=\'allow_cookies={"essential":"1","functional":{"all":"1"},"marketing":{"all":"0"}}; path=/;\';': () => {
        try {
            document.cookie = 'allow_cookies={"essential":"1","functional":{"all":"1"},"marketing":{"all":"0"}}; path=/;';
        } catch (o) {
            console.error("Error executing AG js: " + o);
        }
    },
    '(function(){-1==document.cookie.indexOf("GPRD")&&(document.cookie="GPRD=128; path=/;",location.reload())})();': () => {
        try {
            -1 == document.cookie.indexOf("GPRD") && (document.cookie = "GPRD=128; path=/;", 
            location.reload());
        } catch (o) {
            console.error("Error executing AG js: " + o);
        }
    },
    'document.cookie="acceptRodoSie=hide; path=/;";': () => {
        try {
            document.cookie = "acceptRodoSie=hide; path=/;";
        } catch (e) {
            console.error("Error executing AG js: " + e);
        }
    },
    '(function(){-1==document.cookie.indexOf("cookie-functional")&&(document.cookie="cookie-functional=1; path=/;",document.cookie="popupek=1; path=/;",location.reload())})();': () => {
        try {
            -1 == document.cookie.indexOf("cookie-functional") && (document.cookie = "cookie-functional=1; path=/;", 
            document.cookie = "popupek=1; path=/;", location.reload());
        } catch (o) {
            console.error("Error executing AG js: " + o);
        }
    },
    '(function(){-1==document.cookie.indexOf("ccb")&&(document.cookie="ccb=facebookAccepted=0&googleAnalyticsAccepted=0&commonCookies=1; path=/;",location.reload())})();': () => {
        try {
            -1 == document.cookie.indexOf("ccb") && (document.cookie = "ccb=facebookAccepted=0&googleAnalyticsAccepted=0&commonCookies=1; path=/;", 
            location.reload());
        } catch (o) {
            console.error("Error executing AG js: " + o);
        }
    },
    "(function(){-1===document.cookie.indexOf(\"CookieConsent\")&&(document.cookie='CookieConsent=mandatory|osm; path=/;')})();": () => {
        try {
            -1 === document.cookie.indexOf("CookieConsent") && (document.cookie = "CookieConsent=mandatory|osm; path=/;");
        } catch (o) {
            console.error("Error executing AG js: " + o);
        }
    },
    '(function(){-1===document.cookie.indexOf("CookieControl")&&(document.cookie=\'CookieControl={"necessaryCookies":["wordpress_*","wordpress_logged_in_*","CookieControl"],"optionalCookies":{"functional_cookies":"accepted"}}\')})();': () => {
        try {
            -1 === document.cookie.indexOf("CookieControl") && (document.cookie = 'CookieControl={"necessaryCookies":["wordpress_*","wordpress_logged_in_*","CookieControl"],"optionalCookies":{"functional_cookies":"accepted"}}');
        } catch (o) {
            console.error("Error executing AG js: " + o);
        }
    },
    '(function(){if(-1==document.cookie.indexOf("CONSENT")){var c=new Date, d=c.getTime(), date = new Date(d + 365 * 60 * 60 * 1000); document.cookie="CONSENT=301212NN; path=/; expires=" + date.toUTCString(), location.reload()}})();': () => {
        try {
            !function() {
                if (-1 == document.cookie.indexOf("CONSENT")) {
                    var e = (new Date).getTime(), o = new Date(e + 1314e6);
                    document.cookie = "CONSENT=301212NN; path=/; expires=" + o.toUTCString(), location.reload();
                }
            }();
        } catch (e) {
            console.error("Error executing AG js: " + e);
        }
    },
    'document.cookie="dsgvo=basic; path=/;";': () => {
        try {
            document.cookie = "dsgvo=basic; path=/;";
        } catch (o) {
            console.error("Error executing AG js: " + o);
        }
    },
    '(function(){if(!document.cookie.includes("CookieInformationConsent=")){var a=encodeURIComponent(\'{"website_uuid":"","timestamp":"","consent_url":"","consent_website":"elkjop.no","consent_domain":"elkjop.no","user_uid":"","consents_approved":["cookie_cat_necessary","cookie_cat_functional","cookie_cat_statistic"],"consents_denied":[],"user_agent":""}\');document.cookie="CookieInformationConsent="+a+"; path=/;"}})();': () => {
        try {
            !function() {
                if (!document.cookie.includes("CookieInformationConsent=")) {
                    var o = encodeURIComponent('{"website_uuid":"","timestamp":"","consent_url":"","consent_website":"elkjop.no","consent_domain":"elkjop.no","user_uid":"","consents_approved":["cookie_cat_necessary","cookie_cat_functional","cookie_cat_statistic"],"consents_denied":[],"user_agent":""}');
                    document.cookie = "CookieInformationConsent=" + o + "; path=/;";
                }
            }();
        } catch (o) {
            console.error("Error executing AG js: " + o);
        }
    },
    '(function(){var a={timestamp:(new Date).getTime(),choice:2,version:"1.0"};document.cookie="mxp="+JSON.stringify(a)+"; path=/"})();': () => {
        try {
            !function() {
                var e = {
                    timestamp: (new Date).getTime(),
                    choice: 2,
                    version: "1.0"
                };
                document.cookie = "mxp=" + JSON.stringify(e) + "; path=/";
            }();
        } catch (e) {
            console.error("Error executing AG js: " + e);
        }
    },
    '(function(){if(-1==document.cookie.indexOf("_chorus_privacy_consent")&&document.location.hostname.includes("bavarianfootballworks.com")){var c=new Date, d=c.getTime(), date = new Date(d + 365 * 60 * 60 * 1000); document.cookie="_chorus_privacy_consent="+d+"; path=/; expires=" + date.toUTCString(), location.reload()}})();': () => {
        try {
            !function() {
                if (-1 == document.cookie.indexOf("_chorus_privacy_consent") && document.location.hostname.includes("bavarianfootballworks.com")) {
                    var o = (new Date).getTime(), e = new Date(o + 1314e6);
                    document.cookie = "_chorus_privacy_consent=" + o + "; path=/; expires=" + e.toUTCString(), 
                    location.reload();
                }
            }();
        } catch (o) {
            console.error("Error executing AG js: " + o);
        }
    },
    '(function(){if(-1==document.cookie.indexOf("_chorus_privacy_consent")&&document.location.hostname.includes("goldenstateofmind.com")){var c=new Date, d=c.getTime(), date = new Date(d + 365 * 60 * 60 * 1000); document.cookie="_chorus_privacy_consent="+d+"; path=/; expires=" + date.toUTCString(), location.reload()}})();': () => {
        try {
            !function() {
                if (-1 == document.cookie.indexOf("_chorus_privacy_consent") && document.location.hostname.includes("goldenstateofmind.com")) {
                    var e = (new Date).getTime(), o = new Date(e + 1314e6);
                    document.cookie = "_chorus_privacy_consent=" + e + "; path=/; expires=" + o.toUTCString(), 
                    location.reload();
                }
            }();
        } catch (e) {
            console.error("Error executing AG js: " + e);
        }
    },
    '(function(){if(-1==document.cookie.indexOf("_chorus_privacy_consent")&&document.location.hostname.includes("mmafighting.com")){var c=new Date, d=c.getTime(), date = new Date(d + 365 * 60 * 60 * 1000); document.cookie="_chorus_privacy_consent="+d+"; path=/; expires=" + date.toUTCString(), location.reload()}})();': () => {
        try {
            !function() {
                if (-1 == document.cookie.indexOf("_chorus_privacy_consent") && document.location.hostname.includes("mmafighting.com")) {
                    var e = (new Date).getTime(), o = new Date(e + 1314e6);
                    document.cookie = "_chorus_privacy_consent=" + e + "; path=/; expires=" + o.toUTCString(), 
                    location.reload();
                }
            }();
        } catch (e) {
            console.error("Error executing AG js: " + e);
        }
    },
    '(function(){-1==document.cookie.indexOf("cms_cookies")&&(document.cookie="cms_cookies=6; path=/;",document.cookie="cms_cookies_saved=true; path=/;",location.reload())})();': () => {
        try {
            -1 == document.cookie.indexOf("cms_cookies") && (document.cookie = "cms_cookies=6; path=/;", 
            document.cookie = "cms_cookies_saved=true; path=/;", location.reload());
        } catch (o) {
            console.error("Error executing AG js: " + o);
        }
    },
    'document.cookie="erlaubte_cookies=1; path=/;";': () => {
        try {
            document.cookie = "erlaubte_cookies=1; path=/;";
        } catch (e) {
            console.error("Error executing AG js: " + e);
        }
    },
    'document.cookie="klaviano_police=1; path=/;";': () => {
        try {
            document.cookie = "klaviano_police=1; path=/;";
        } catch (o) {
            console.error("Error executing AG js: " + o);
        }
    },
    'document.cookie=\'cookieConsent={"statistical":0,"personalization":0,"targeting":0}; path=/;\';': () => {
        try {
            document.cookie = 'cookieConsent={"statistical":0,"personalization":0,"targeting":0}; path=/;';
        } catch (o) {
            console.error("Error executing AG js: " + o);
        }
    },
    '(function(){if(!document.cookie.includes("trackingPermissionConsentsValue=")){var a=encodeURIComponent(\'"cookies_analytics":false,"cookies_personalization":false,"cookies_advertisement":false\');document.cookie="trackingPermissionConsentsValue={"+a+"}; path=/;"}})();': () => {
        try {
            !function() {
                if (!document.cookie.includes("trackingPermissionConsentsValue=")) {
                    var e = encodeURIComponent('"cookies_analytics":false,"cookies_personalization":false,"cookies_advertisement":false');
                    document.cookie = "trackingPermissionConsentsValue={" + e + "}; path=/;";
                }
            }();
        } catch (e) {
            console.error("Error executing AG js: " + e);
        }
    },
    'document.cookie="allowTracking=false; path=/;"; document.cookie="trackingSettings={%22ads%22:false%2C%22performance%22:false}; path=/;";': () => {
        try {
            document.cookie = "allowTracking=false; path=/;";
            document.cookie = "trackingSettings={%22ads%22:false%2C%22performance%22:false}; path=/;";
        } catch (e) {
            console.error("Error executing AG js: " + e);
        }
    },
    'document.cookie="userConsent=%7B%22marketing%22%3Afalse%2C%22version%22%3A%221%22%7D; path=/;";': () => {
        try {
            document.cookie = "userConsent=%7B%22marketing%22%3Afalse%2C%22version%22%3A%221%22%7D; path=/;";
        } catch (e) {
            console.error("Error executing AG js: " + e);
        }
    },
    'document.cookie="sendgb_cookiewarning=1; path=/;";': () => {
        try {
            document.cookie = "sendgb_cookiewarning=1; path=/;";
        } catch (o) {
            console.error("Error executing AG js: " + o);
        }
    },
    'document.cookie="rodopop=1; path=/;";': () => {
        try {
            document.cookie = "rodopop=1; path=/;";
        } catch (o) {
            console.error("Error executing AG js: " + o);
        }
    },
    'document.cookie="eu_cn=1; path=/;";': () => {
        try {
            document.cookie = "eu_cn=1; path=/;";
        } catch (c) {
            console.error("Error executing AG js: " + c);
        }
    },
    'document.cookie="gdprAccepted=true; path=/;";': () => {
        try {
            document.cookie = "gdprAccepted=true; path=/;";
        } catch (e) {
            console.error("Error executing AG js: " + e);
        }
    },
    '(function(){if(-1==document.cookie.indexOf("BCPermissionLevel")){var c=new Date, d=c.getTime(), date = new Date(d + 365 * 60 * 60 * 1000); document.cookie="BCPermissionLevel=PERSONAL; path=/; expires=" + date.toUTCString(), location.reload()}})();': () => {
        try {
            !function() {
                if (-1 == document.cookie.indexOf("BCPermissionLevel")) {
                    var e = (new Date).getTime(), o = new Date(e + 1314e6);
                    document.cookie = "BCPermissionLevel=PERSONAL; path=/; expires=" + o.toUTCString(), 
                    location.reload();
                }
            }();
        } catch (e) {
            console.error("Error executing AG js: " + e);
        }
    },
    '(function(){if(-1==document.cookie.indexOf("_chorus_privacy_consent")){var c=new Date, d=c.getTime(), date = new Date(d + 365 * 60 * 60 * 1000); document.cookie="_chorus_privacy_consent="+d+"; path=/; expires=" + date.toUTCString(), location.reload()}})();': () => {
        try {
            !function() {
                if (-1 == document.cookie.indexOf("_chorus_privacy_consent")) {
                    var e = (new Date).getTime(), o = new Date(e + 1314e6);
                    document.cookie = "_chorus_privacy_consent=" + e + "; path=/; expires=" + o.toUTCString(), 
                    location.reload();
                }
            }();
        } catch (e) {
            console.error("Error executing AG js: " + e);
        }
    },
    "!function(a,b,c,f,g,d,e){e=a[c]||a['WebKit'+c]||a['Moz'+c],e&&(d=new e(function(){b[f].contains(g)&&(b[f].remove(g),d.disconnect())}),d.observe(b,{attributes:!0,attributeFilter:['class']}))}(window,document.documentElement,'MutationObserver','classList','layer_cookie__visible');": () => {
        try {
            !function(e, t, o, n, i, r, c) {
                (c = e[o] || e["WebKit" + o] || e["Moz" + o]) && (r = new c((function() {
                    t[n].contains(i) && (t[n].remove(i), r.disconnect());
                }))).observe(t, {
                    attributes: !0,
                    attributeFilter: [ "class" ]
                });
            }(window, document.documentElement, "MutationObserver", "classList", "layer_cookie__visible");
        } catch (e) {
            console.error("Error executing AG js: " + e);
        }
    },
    'var cw;Object.defineProperty(window,"cookieWallSettings",{get:function(){return cw},set:function(a){document.cookie="rtlcookieconsent="+a.version.toString()+";";cw=a}});': () => {
        try {
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
        } catch (e) {
            console.error("Error executing AG js: " + e);
        }
    },
    '(()=>{if(!location.pathname.includes("/search"))return;const t={attributes:!0,childList:!0,subtree:!0},e=(t,e)=>{for(const n of t){const t=n.target.querySelector(".privacy-statement + .get-started-btn-wrapper > button.inline-explicit");t&&(t.click(),e.disconnect())}},n={apply:(n,o,c)=>{const r=Reflect.apply(n,o,c);if(o&&o.matches("cib-muid-consent")){new MutationObserver(e).observe(r,t)}return r}};window.Element.prototype.attachShadow=new Proxy(window.Element.prototype.attachShadow,n)})();': () => {
        try {
            (() => {
                if (!location.pathname.includes("/search")) return;
                const t = {
                    attributes: !0,
                    childList: !0,
                    subtree: !0
                }, e = (t, e) => {
                    for (const r of t) {
                        const t = r.target.querySelector(".privacy-statement + .get-started-btn-wrapper > button.inline-explicit");
                        t && (t.click(), e.disconnect());
                    }
                }, r = {
                    apply: (r, n, o) => {
                        const c = Reflect.apply(r, n, o);
                        n && n.matches("cib-muid-consent") && new MutationObserver(e).observe(c, t);
                        return c;
                    }
                };
                window.Element.prototype.attachShadow = new Proxy(window.Element.prototype.attachShadow, r);
            })();
        } catch (t) {
            console.error("Error executing AG js: " + t);
        }
    },
    '(()=>{let t,e=!1;const o=new MutationObserver(((e,o)=>{const c=t?.querySelector(\'button[data-testid="uc-accept-all-button"]\');c&&(c.click(),o.disconnect())})),c={apply:(c,n,p)=>{const r=Reflect.apply(c,n,p);return!e&&n.matches("#usercentrics-root")&&(e=!0,t=r),o.observe(r,{subtree:!0,childList:!0}),r}};window.Element.prototype.attachShadow=new Proxy(window.Element.prototype.attachShadow,c)})();': () => {
        try {
            (() => {
                let t, e = !1;
                const o = new MutationObserver(((e, o) => {
                    const c = t?.querySelector('button[data-testid="uc-accept-all-button"]');
                    c && (c.click(), o.disconnect());
                })), c = {
                    apply: (c, r, n) => {
                        const a = Reflect.apply(c, r, n);
                        return !e && r.matches("#usercentrics-root") && (e = !0, t = a), o.observe(a, {
                            subtree: !0,
                            childList: !0
                        }), a;
                    }
                };
                window.Element.prototype.attachShadow = new Proxy(window.Element.prototype.attachShadow, c);
            })();
        } catch (t) {
            console.error("Error executing AG js: " + t);
        }
    },
    '(()=>{let t,e=!1;const o=new MutationObserver(((e,o)=>{const c=t?.querySelector("#cmpbox a.cmptxt_btn_yes");c&&(c.click(),o.disconnect())})),c={apply:(c,n,p)=>{const r=Reflect.apply(c,n,p);return!e&&n.matches("#cmpwrapper")&&(e=!0,t=r),o.observe(r,{subtree:!0,childList:!0}),r}};window.Element.prototype.attachShadow=new Proxy(window.Element.prototype.attachShadow,c)})();': () => {
        try {
            (() => {
                let e, t = !1;
                const o = new MutationObserver(((t, o) => {
                    const c = e?.querySelector("#cmpbox a.cmptxt_btn_yes");
                    c && (c.click(), o.disconnect());
                })), c = {
                    apply: (c, r, n) => {
                        const a = Reflect.apply(c, r, n);
                        return !t && r.matches("#cmpwrapper") && (t = !0, e = a), o.observe(a, {
                            subtree: !0,
                            childList: !0
                        }), a;
                    }
                };
                window.Element.prototype.attachShadow = new Proxy(window.Element.prototype.attachShadow, c);
            })();
        } catch (e) {
            console.error("Error executing AG js: " + e);
        }
    },
    '(function(){window.self!==window.top||document.cookie.includes("visitor=")||(document.cookie="visitor=1; path=/;",document.cookie&&location.reload())})();': () => {
        try {
            window.self !== window.top || document.cookie.includes("visitor=") || (document.cookie = "visitor=1; path=/;", 
            document.cookie && location.reload());
        } catch (o) {
            console.error("Error executing AG js: " + o);
        }
    },
    '(function(){try{var time=(new Date).getTime();var cookieDate=new Date(time+1314E6);var hostname=location.host;var locSubString=null;if(!hostname.startsWith("google.")&&!hostname.startsWith("youtube."))locSubString=hostname.substring(hostname.indexOf(".")+1);var loc=locSubString||hostname;if(document.cookie.indexOf("CONSENT=YES")!==-1)return;document.cookie="CONSENT=YES+; domain="+loc+"; path=/; expires="+cookieDate.toUTCString()}catch(ex){console.error("AG: failed to set consent cookie: "+ex)}})();': () => {
        try {
            !function() {
                try {
                    var e = (new Date).getTime(), t = new Date(e + 1314e6), o = location.host, r = null;
                    o.startsWith("google.") || o.startsWith("youtube.") || (r = o.substring(o.indexOf(".") + 1));
                    var n = r || o;
                    if (-1 !== document.cookie.indexOf("CONSENT=YES")) return;
                    document.cookie = "CONSENT=YES+; domain=" + n + "; path=/; expires=" + t.toUTCString();
                } catch (e) {
                    console.error("AG: failed to set consent cookie: " + e);
                }
            }();
        } catch (e) {
            console.error("Error executing AG js: " + e);
        }
    },
    '(function(o){function a(a){return{get:function(){return a},set:b}}function b(){}function c(){throw"Adguard: stopped a script execution.";}var d={},e=a(function(a){a(!1)}),f={},g=EventTarget.prototype.addEventListener;o(d,{spid_control_callback:a(b),content_control_callback:a(b),vid_control_callback:a(b)});o(f,{config:a(d),_setSpKey:{get:c,set:c},checkState:e,isAdBlocking:e,getSafeUri:a(function(a){return a}),pageChange:a(b),setupSmartBeacons:a(b)});Object.defineProperty(window,"_sp_",a(f));EventTarget.prototype.addEventListener=function(a){"sp.blocking"!=a&&"sp.not_blocking"!=a&&g.apply(this,arguments)}})(Object.defineProperties);': () => {
        try {
            !function(t) {
                function e(t) {
                    return {
                        get: function() {
                            return t;
                        },
                        set: n
                    };
                }
                function n() {}
                function o() {
                    throw "Adguard: stopped a script execution.";
                }
                var c = {}, r = e((function(t) {
                    t(!1);
                })), i = {}, a = EventTarget.prototype.addEventListener;
                t(c, {
                    spid_control_callback: e(n),
                    content_control_callback: e(n),
                    vid_control_callback: e(n)
                });
                t(i, {
                    config: e(c),
                    _setSpKey: {
                        get: o,
                        set: o
                    },
                    checkState: r,
                    isAdBlocking: r,
                    getSafeUri: e((function(t) {
                        return t;
                    })),
                    pageChange: e(n),
                    setupSmartBeacons: e(n)
                });
                Object.defineProperty(window, "_sp_", e(i));
                EventTarget.prototype.addEventListener = function(t) {
                    "sp.blocking" != t && "sp.not_blocking" != t && a.apply(this, arguments);
                };
            }(Object.defineProperties);
        } catch (t) {
            console.error("Error executing AG js: " + t);
        }
    },
    '(()=>{const d={getUserConsentStatusForVendor:()=>!0};window.didomiOnReady=window.didomiOnReady||[],window.didomiOnReady.push=n=>{"function"==typeof n&&n(d)}})();': () => {
        try {
            (() => {
                const o = {
                    getUserConsentStatusForVendor: () => !0
                };
                window.didomiOnReady = window.didomiOnReady || [], window.didomiOnReady.push = n => {
                    "function" == typeof n && n(o);
                };
            })();
        } catch (o) {
            console.error("Error executing AG js: " + o);
        }
    },
    '(()=>{const e={apply:async(e,t,a)=>{if(a[0]&&a[0]?.match(/adsbygoogle|doubleclick|googlesyndication|static\\.cloudflareinsights\\.com\\/beacon\\.min\\.js/)){const e=(e="{}",t="",a="opaque")=>{const n=new Response(e,{statusText:"OK"}),o=String((s=50800,r=50900,Math.floor(Math.random()*(r-s+1)+s)));var s,r;return n.headers.set("Content-Length",o),Object.defineProperties(n,{type:{value:a},status:{value:0},statusText:{value:""},url:{value:""}}),Promise.resolve(n)};return e("{}",a[0])}return Reflect.apply(e,t,a)}};window.fetch=new Proxy(window.fetch,e)})();': () => {
        try {
            (() => {
                const e = {
                    apply: async (e, t, o) => {
                        if (o[0] && o[0]?.match(/adsbygoogle|doubleclick|googlesyndication|static\.cloudflareinsights\.com\/beacon\.min\.js/)) {
                            const e = (e = "{}", t = "", o = "opaque") => {
                                const n = new Response(e, {
                                    statusText: "OK"
                                }), s = String(Math.floor(101 * Math.random() + 50800));
                                return n.headers.set("Content-Length", s), Object.defineProperties(n, {
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
                                }), Promise.resolve(n);
                            };
                            return e("{}", o[0]);
                        }
                        return Reflect.apply(e, t, o);
                    }
                };
                window.fetch = new Proxy(window.fetch, e);
            })();
        } catch (e) {
            console.error("Error executing AG js: " + e);
        }
    },
    "window.ad_allowed = true;": () => {
        try {
            window.ad_allowed = !0;
        } catch (r) {
            console.error("Error executing AG js: " + r);
        }
    },
    "(function(){var b=window.setTimeout;window.setTimeout=function(a,c){if(!/google_ads_frame/.test(a.toString()))return b(a,c)};})();": () => {
        try {
            !function() {
                var t = window.setTimeout;
                window.setTimeout = function(o, e) {
                    if (!/google_ads_frame/.test(o.toString())) return t(o, e);
                };
            }();
        } catch (t) {
            console.error("Error executing AG js: " + t);
        }
    },
    'var _st = window.setTimeout; window.setTimeout = function(a, b) { if(!/var ad = document\\.querySelector\\("ins\\.adsbygoogle"\\);/.test(a)){ _st(a,b);}};': () => {
        try {
            var _st = window.setTimeout;
            window.setTimeout = function(e, t) {
                /var ad = document\.querySelector\("ins\.adsbygoogle"\);/.test(e) || _st(e, t);
            };
        } catch (e) {
            console.error("Error executing AG js: " + e);
        }
    },
    "document.avp_ready = 1;": () => {
        try {
            document.avp_ready = 1;
        } catch (r) {
            console.error("Error executing AG js: " + r);
        }
    },
    "window.ADTECH = function() {};": () => {
        try {
            window.ADTECH = function() {};
        } catch (r) {
            console.error("Error executing AG js: " + r);
        }
    },
    "fuckAdBlock = function() {};": () => {
        try {
            fuckAdBlock = function() {};
        } catch (c) {
            console.error("Error executing AG js: " + c);
        }
    },
    "window.IM = [1,2,3];": () => {
        try {
            window.IM = [ 1, 2, 3 ];
        } catch (r) {
            console.error("Error executing AG js: " + r);
        }
    },
    "window.google_jobrunner = function() { };": () => {
        try {
            window.google_jobrunner = function() {};
        } catch (o) {
            console.error("Error executing AG js: " + o);
        }
    },
    "(function(){var c=window.setTimeout;window.setTimeout=function(f,g){return !Number.isNaN(g)&&/\\$\\('#l'\\+|#linkdiv/.test(f.toString())&&(g*=0.01),c.apply(this,arguments)}.bind(window)})();": () => {
        try {
            !function() {
                var t = window.setTimeout;
                window.setTimeout = function(i, n) {
                    return !Number.isNaN(n) && /\$\('#l'\+|#linkdiv/.test(i.toString()) && (n *= .01), 
                    t.apply(this, arguments);
                }.bind(window);
            }();
        } catch (t) {
            console.error("Error executing AG js: " + t);
        }
    },
    "window.blockAdBlock = function() {};": () => {
        try {
            window.blockAdBlock = function() {};
        } catch (o) {
            console.error("Error executing AG js: " + o);
        }
    },
    '!function(){const e={apply:(e,t,o)=>{const i=o[1];if(!i||"object"!=typeof i.QiyiPlayerProphetData)return Reflect.apply(e,t,o)}};window.Object.defineProperties=new Proxy(window.Object.defineProperties,e)}();': () => {
        try {
            !function() {
                const e = {
                    apply: (e, r, t) => {
                        const o = t[1];
                        if (!o || "object" != typeof o.QiyiPlayerProphetData) return Reflect.apply(e, r, t);
                    }
                };
                window.Object.defineProperties = new Proxy(window.Object.defineProperties, e);
            }();
        } catch (e) {
            console.error("Error executing AG js: " + e);
        }
    },
    "!function(){const s={apply:(c,e,n)=>(n[0]?.adSlots&&(n[0].adSlots=[]),n[1]?.success&&(n[1].success=new Proxy(n[1].success,s)),Reflect.apply(c,e,n))};window.Object.assign=new Proxy(window.Object.assign,s)}();": () => {
        try {
            !function() {
                const s = {
                    apply: (c, e, o) => (o[0]?.adSlots && (o[0].adSlots = []), o[1]?.success && (o[1].success = new Proxy(o[1].success, s)), 
                    Reflect.apply(c, e, o))
                };
                window.Object.assign = new Proxy(window.Object.assign, s);
            }();
        } catch (s) {
            console.error("Error executing AG js: " + s);
        }
    },
    'document.cookie="popup=9999999999999; path=/;";': () => {
        try {
            document.cookie = "popup=9999999999999; path=/;";
        } catch (o) {
            console.error("Error executing AG js: " + o);
        }
    },
    'document.cookie="overlay-geschenk=donotshowfor7days; path=/;";': () => {
        try {
            document.cookie = "overlay-geschenk=donotshowfor7days; path=/;";
        } catch (o) {
            console.error("Error executing AG js: " + o);
        }
    },
    'document.cookie="popupSubscription=1; path=/;";': () => {
        try {
            document.cookie = "popupSubscription=1; path=/;";
        } catch (o) {
            console.error("Error executing AG js: " + o);
        }
    },
    'document.cookie="hide_footer_login_layer=T; path=/;";': () => {
        try {
            document.cookie = "hide_footer_login_layer=T; path=/;";
        } catch (o) {
            console.error("Error executing AG js: " + o);
        }
    },
    '!function(){const t={apply:(t,e,n)=>{if(n[0]&&"function"==typeof n[0])try{if(n[0].toString().includes("LOGIN_FORCE_TIME"))return}catch(t){console.trace(t)}return Reflect.apply(t,e,n)}},e=new Proxy(window.setTimeout,t);Object.defineProperty(window,"setTimeout",{set:function(){},get:function(){return e}})}();': () => {
        try {
            !function() {
                const t = {
                    apply: (t, e, n) => {
                        if (n[0] && "function" == typeof n[0]) try {
                            if (n[0].toString().includes("LOGIN_FORCE_TIME")) return;
                        } catch (t) {
                            console.trace(t);
                        }
                        return Reflect.apply(t, e, n);
                    }
                }, e = new Proxy(window.setTimeout, t);
                Object.defineProperty(window, "setTimeout", {
                    set: function() {},
                    get: function() {
                        return e;
                    }
                });
            }();
        } catch (t) {
            console.error("Error executing AG js: " + t);
        }
    },
    "(function(){window.setTimeout=new Proxy(window.setTimeout,{apply:(a,b,c)=>c&&c[0]&&/SkipMsg\\(\\)/.test(c[0].toString())&&c[1]?(c[1]=1,Reflect.apply(a,b,c)):Reflect.apply(a,b,c)})})();": () => {
        try {
            window.setTimeout = new Proxy(window.setTimeout, {
                apply: (e, t, o) => o && o[0] && /SkipMsg\(\)/.test(o[0].toString()) && o[1] ? (o[1] = 1, 
                Reflect.apply(e, t, o)) : Reflect.apply(e, t, o)
            });
        } catch (e) {
            console.error("Error executing AG js: " + e);
        }
    },
    'document.cookie="show_share=true; path=/;";': () => {
        try {
            document.cookie = "show_share=true; path=/;";
        } catch (r) {
            console.error("Error executing AG js: " + r);
        }
    },
    '(function(){var a=new Date,b=a.getTime();document.cookie="ips4_bacalltoactionpopup="+b})();': () => {
        try {
            !function() {
                var o = (new Date).getTime();
                document.cookie = "ips4_bacalltoactionpopup=" + o;
            }();
        } catch (o) {
            console.error("Error executing AG js: " + o);
        }
    },
    "if (window.PushManager) { window.PushManager.prototype.subscribe = function () { return { then: function (func) { } }; }; }": () => {
        try {
            window.PushManager && (window.PushManager.prototype.subscribe = function() {
                return {
                    then: function(r) {}
                };
            });
        } catch (r) {
            console.error("Error executing AG js: " + r);
        }
    },
    '(()=>{const t={construct:(t,e,n)=>{const r=e[0],o=r?.toString(),c=o?.includes("e[0].intersectionRatio");return c&&(e[0]=()=>{}),Reflect.construct(t,e,n)}};window.IntersectionObserver=new Proxy(window.IntersectionObserver,t)})();': () => {
        try {
            (() => {
                const e = {
                    construct: (e, r, t) => {
                        const n = r[0], o = n?.toString(), c = o?.includes("e[0].intersectionRatio");
                        return c && (r[0] = () => {}), Reflect.construct(e, r, t);
                    }
                };
                window.IntersectionObserver = new Proxy(window.IntersectionObserver, e);
            })();
        } catch (e) {
            console.error("Error executing AG js: " + e);
        }
    },
    '(function(){var b=document.addEventListener;document.addEventListener=function(c,a,d){if(a&&-1==a.toString().indexOf("adsBlocked"))return b(c,a,d)}.bind(window)})();': () => {
        try {
            !function() {
                var n = document.addEventListener;
                document.addEventListener = function(e, t, r) {
                    if (t && -1 == t.toString().indexOf("adsBlocked")) return n(e, t, r);
                }.bind(window);
            }();
        } catch (n) {
            console.error("Error executing AG js: " + n);
        }
    },
    '(function(b){Object.defineProperty(Element.prototype,"innerHTML",{get:function(){return b.get.call(this)},set:function(a){/^(?:<([abisuq]) id="[^"]*"><\\/\\1>)*$/.test(a)||b.set.call(this,a)},enumerable:!0,configurable:!0})})(Object.getOwnPropertyDescriptor(Element.prototype,"innerHTML"));': () => {
        try {
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
        } catch (e) {
            console.error("Error executing AG js: " + e);
        }
    },
    '(function(a){Object.defineProperty(window,"upManager",{get:function(){return{push:a,register:a,fireNow:a,start:a}},set:function(a){if(!(a instanceof Error))throw Error();}})})(function(){});': () => {
        try {
            !function(r) {
                Object.defineProperty(window, "upManager", {
                    get: function() {
                        return {
                            push: r,
                            register: r,
                            fireNow: r,
                            start: r
                        };
                    },
                    set: function(r) {
                        if (!(r instanceof Error)) throw Error();
                    }
                });
            }((function() {}));
        } catch (r) {
            console.error("Error executing AG js: " + r);
        }
    },
    '(function(){var b=XMLHttpRequest.prototype.open,c=/[/.@](piguiqproxy\\.com|rcdn\\.pro|amgload\\.net|dsn-fishki\\.ru|v6t39t\\.ru|greencuttlefish\\.com|rgy1wk\\.ru|vt4dlx\\.ru|d38dub\\.ru)[:/]/i;XMLHttpRequest.prototype.open=function(d,a){if("GET"===d&&c.test(a))this.send=function(){return null},this.setRequestHeader=function(){return null},console.log("AG has blocked request: ",a);else return b.apply(this,arguments)}})();': () => {
        try {
            !function() {
                var t = XMLHttpRequest.prototype.open, e = /[/.@](piguiqproxy\.com|rcdn\.pro|amgload\.net|dsn-fishki\.ru|v6t39t\.ru|greencuttlefish\.com|rgy1wk\.ru|vt4dlx\.ru|d38dub\.ru)[:/]/i;
                XMLHttpRequest.prototype.open = function(r, n) {
                    if ("GET" !== r || !e.test(n)) return t.apply(this, arguments);
                    this.send = function() {
                        return null;
                    }, this.setRequestHeader = function() {
                        return null;
                    }, console.log("AG has blocked request: ", n);
                };
            }();
        } catch (t) {
            console.error("Error executing AG js: " + t);
        }
    },
    '(function(){var b=XMLHttpRequest.prototype.open,c=/[/.@](piguiqproxy\\.com|rcdn\\.pro|amgload\\.net|dsn-fishki\\.ru|v6t39t\\.ru|greencuttlefish\\.com|rgy1wk\\.ru|vt4dlx\\.ru|d38dub\\.ru|csp-oz66pp\\.ru|ok9ydq\\.ru|kingoablc\\.com)[:/]/i;XMLHttpRequest.prototype.open=function(d,a){if("GET"===d&&c.test(a))this.send=function(){return null},this.setRequestHeader=function(){return null},console.log("AG has blocked request: ",a);else return b.apply(this,arguments)}})();': () => {
        try {
            !function() {
                var t = XMLHttpRequest.prototype.open, e = /[/.@](piguiqproxy\.com|rcdn\.pro|amgload\.net|dsn-fishki\.ru|v6t39t\.ru|greencuttlefish\.com|rgy1wk\.ru|vt4dlx\.ru|d38dub\.ru|csp-oz66pp\.ru|ok9ydq\.ru|kingoablc\.com)[:/]/i;
                XMLHttpRequest.prototype.open = function(r, o) {
                    if ("GET" !== r || !e.test(o)) return t.apply(this, arguments);
                    this.send = function() {
                        return null;
                    }, this.setRequestHeader = function() {
                        return null;
                    }, console.log("AG has blocked request: ", o);
                };
            }();
        } catch (t) {
            console.error("Error executing AG js: " + t);
        }
    },
    '(()=>{const e={breakStatus:"done"},o=["beforeReward","adViewed","adBreakDone"];window.adsbygoogle=window.adsbygoogle||[],window.adsbygoogle.push=function(d){var a;d&&"object"==typeof d&&(a=d,o.every((e=>e in a&&"function"==typeof a[e])))&&(d.beforeReward(),d.adViewed(),d.adBreakDone(e))}})();': () => {
        try {
            (() => {
                const e = {
                    breakStatus: "done"
                }, o = [ "beforeReward", "adViewed", "adBreakDone" ];
                window.adsbygoogle = window.adsbygoogle || [], window.adsbygoogle.push = function(r) {
                    var a;
                    r && "object" == typeof r && (a = r, o.every((e => e in a && "function" == typeof a[e]))) && (r.beforeReward(), 
                    r.adViewed(), r.adBreakDone(e));
                };
            })();
        } catch (e) {
            console.error("Error executing AG js: " + e);
        }
    },
    '(()=>{document.addEventListener(\'DOMContentLoaded\',()=>{const t=document.querySelector(\'a[href*="uploadmall.com/cgi-bin/dl.cgi/"]\');if(t){const e=t.getAttribute("href");t.addEventListener("click",(t=>{try{const t=`{"link":"${e}"}`,c=`https://mendationforc.info/?cc=${btoa(t)}`;window.open(c)}catch(t){console.debug(t)}}))}})})();': () => {
        try {
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
        } catch (e) {
            console.error("Error executing AG js: " + e);
        }
    },
    '(()=>{const e={apply:(e,n,t)=>{const o=t[1];return o&&["adBlockingDetected","assessAdBlocking"].includes(o)&&t[2]&&"function"==typeof t[2].value&&(t[2].value=()=>{}),Reflect.apply(e,n,t)}};window.Object.defineProperty=new Proxy(window.Object.defineProperty,e)})();': () => {
        try {
            (() => {
                const e = {
                    apply: (e, n, o) => {
                        const t = o[1];
                        return t && [ "adBlockingDetected", "assessAdBlocking" ].includes(t) && o[2] && "function" == typeof o[2].value && (o[2].value = () => {}), 
                        Reflect.apply(e, n, o);
                    }
                };
                window.Object.defineProperty = new Proxy(window.Object.defineProperty, e);
            })();
        } catch (e) {
            console.error("Error executing AG js: " + e);
        }
    },
    "(()=>{const e=()=>{};window.powerTag={Init:[]},window.powerTag.Init.push=function(e){try{e()}catch(e){console.debug(e)}},window.powerAPITag={initRewarded:function(e,o){o&&o.onComplete&&setTimeout((()=>{try{o.onComplete()}catch(e){console.debug(e)}}),1e3)},display:e,mobileDetect:e,initStickyBanner:e,getRewardedAd:e}})();": () => {
        try {
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
        } catch (e) {
            console.error("Error executing AG js: " + e);
        }
    },
    '(()=>{const t={apply:(t,n,e)=>{if(e[0]&&null===e[0].html?.detected&&"function"==typeof e[0].html?.instance?.start&&"function"==typeof e[0].env?.instance?.start&&"function"==typeof e[0].http?.instance?.start){const t=function(){Object.keys(this).forEach((t=>{"boolean"==typeof this[t]&&(this[t]=!1)}))};["html","env","http"].forEach((n=>{e[0][n].instance.start=t}))}return Reflect.apply(t,n,e)}};window.Object.keys=new Proxy(window.Object.keys,t)})();': () => {
        try {
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
        } catch (t) {
            console.error("Error executing AG js: " + t);
        }
    },
    "(()=>{document.addEventListener('DOMContentLoaded',()=>{var el=document.body; var ce=document.createElement('div'); if(el) { el.appendChild(ce); ce.setAttribute(\"id\", \"QGSBETJjtZkYH\"); }})})();": () => {
        try {
            document.addEventListener("DOMContentLoaded", (() => {
                var e = document.body, t = document.createElement("div");
                if (e) {
                    e.appendChild(t);
                    t.setAttribute("id", "QGSBETJjtZkYH");
                }
            }));
        } catch (e) {
            console.error("Error executing AG js: " + e);
        }
    },
    '(()=>{document.addEventListener(\'DOMContentLoaded\',()=>{const e=document.querySelector("#widescreen1");if(e){const t=document.createElement("div");t.setAttribute("id","google_ads_iframe_"),e.appendChild(t)}})})();': () => {
        try {
            document.addEventListener("DOMContentLoaded", (() => {
                const e = document.querySelector("#widescreen1");
                if (e) {
                    const t = document.createElement("div");
                    t.setAttribute("id", "google_ads_iframe_"), e.appendChild(t);
                }
            }));
        } catch (e) {
            console.error("Error executing AG js: " + e);
        }
    },
    '(()=>{const e=new Set(["fimg","faimg","fbmg","fcmg","fdmg","femg","ffmg","fgmg","fjmg","fkmg"]),t={apply:(t,c,n)=>{const s=n[2];if(s){const t=Object.keys(s).length;if(t>1&&t<20)for(let t in s)if(e.has(t)&&!0===n[2][t])try{n[2][t]=!1}catch(e){console.trace(e)}else if(!0===s[t])try{const e=(new Error).stack;/NodeList\\.forEach|(<anonymous>|blob):[\\s\\S]{1,500}$/.test(e)&&(s[t]=!1)}catch(e){console.trace(e)}}return Reflect.apply(t,c,n)}};window.Object.assign=new Proxy(window.Object.assign,t)})();': () => {
        try {
            (() => {
                const e = new Set([ "fimg", "faimg", "fbmg", "fcmg", "fdmg", "femg", "ffmg", "fgmg", "fjmg", "fkmg" ]), t = {
                    apply: (t, c, o) => {
                        const n = o[2];
                        if (n) {
                            const t = Object.keys(n).length;
                            if (t > 1 && t < 20) for (let t in n) if (e.has(t) && !0 === o[2][t]) try {
                                o[2][t] = !1;
                            } catch (e) {
                                console.trace(e);
                            } else if (!0 === n[t]) try {
                                const e = (new Error).stack;
                                /NodeList\.forEach|(<anonymous>|blob):[\s\S]{1,500}$/.test(e) && (n[t] = !1);
                            } catch (e) {
                                console.trace(e);
                            }
                        }
                        return Reflect.apply(t, c, o);
                    }
                };
                window.Object.assign = new Proxy(window.Object.assign, t);
            })();
        } catch (e) {
            console.error("Error executing AG js: " + e);
        }
    },
    '(()=>{const e={apply:(e,t,p)=>{const o=p[1];return o&&"string"==typeof o&&o.match(/pagead2\\.googlesyndication\\.com|google.*\\.js|\\/.*?\\/.*?ad.*?\\.js|\\.(shop|quest|autos)\\/.*?\\.(js|php|html)/)&&(t.prevent=!0),Reflect.apply(e,t,p)}};window.XMLHttpRequest.prototype.open=new Proxy(window.XMLHttpRequest.prototype.open,e);const t={apply:(e,t,p)=>{if(!t.prevent)return Reflect.apply(e,t,p)}};window.XMLHttpRequest.prototype.send=new Proxy(window.XMLHttpRequest.prototype.send,t)})();': () => {
        try {
            (() => {
                const t = {
                    apply: (t, e, o) => {
                        const p = o[1];
                        return p && "string" == typeof p && p.match(/pagead2\.googlesyndication\.com|google.*\.js|\/.*?\/.*?ad.*?\.js|\.(shop|quest|autos)\/.*?\.(js|php|html)/) && (e.prevent = !0), 
                        Reflect.apply(t, e, o);
                    }
                };
                window.XMLHttpRequest.prototype.open = new Proxy(window.XMLHttpRequest.prototype.open, t);
                const e = {
                    apply: (t, e, o) => {
                        if (!e.prevent) return Reflect.apply(t, e, o);
                    }
                };
                window.XMLHttpRequest.prototype.send = new Proxy(window.XMLHttpRequest.prototype.send, e);
            })();
        } catch (t) {
            console.error("Error executing AG js: " + t);
        }
    },
    '(()=>{const e=()=>{document.querySelectorAll(".chakra-portal").forEach((e=>{e.querySelector(\'.chakra-modal__overlay[style*="opacity"]\')&&e.setAttribute("style","display: none !important;")}))},t=()=>{},a=function(t,a){const r={name:t,listener:a};requestAnimationFrame((()=>{try{"rewardedSlotGranted"===r.name&&setTimeout(e,2e3),r.listener()}catch(e){}}))};window.googletag={cmd:[],pubads:()=>({addEventListener:a,removeEventListener:t,refresh:t,getTargeting:()=>[],setTargeting:t,disableInitialLoad:t,enableSingleRequest:t,collapseEmptyDivs:t,getSlots:t}),defineSlot:()=>({addService(){}}),defineOutOfPageSlot:t,enableServices:t,display:t,enums:{OutOfPageFormat:{REWARDED:1}}},googletag.cmd.push=e=>{try{e()}catch(e){}return 1}})();': () => {
        try {
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
        } catch (e) {
            console.error("Error executing AG js: " + e);
        }
    },
    '(()=>{document.addEventListener(\'DOMContentLoaded\',()=>{if(window.CryptoJSAesJson&&window.CryptoJSAesJson.decrypt){const e=document.createElement("link");function t(){const t=document.querySelector(".entry-header.header");return parseInt(t.getAttribute("data-id"))}e.setAttribute("rel","stylesheet"),e.setAttribute("media","all"),e.setAttribute("href","/wp-content/cache/autoptimize/css/autoptimize_92c5b1cf0217cba9b3fab27d39f320b9.css"),document.head.appendChild(e);const r=3,n=5,o=13,a="07";let c="",i="";const d=1,l=6,g=1,s=5,u=2,p=8,m=8,A=(t,e)=>parseInt(t.toString()+e.toString()),b=(t,e,r)=>t.toString()+e.toString()+r.toString(),S=()=>{const e=document.querySelectorAll(".reading-content .page-break img").length;let c=parseInt((t()+A(o,a))*r-e);return c=A(2*n+1,c),c},h=()=>{const e=document.querySelectorAll(".reading-content .page-break img").length;let r=parseInt((t()+A(p,m))*(2*d)-e-(2*d*2+1));return r=b(2*l+g+g+1,c,r),r},y=()=>{const e=document.querySelectorAll(".reading-content .page-break img").length;return b(t()+2*s*2,i,e*(2*u))},f=(t,e)=>CryptoJSAesJson.decrypt(t,e);let k=document.querySelectorAll(".reading-content .page-break img");k.forEach((t=>{const e=t.getAttribute("id"),r=f(e,S().toString());t.setAttribute("id",r)})),k=document.querySelectorAll(".reading-content .page-break img"),k.forEach((t=>{const e=t.getAttribute("id"),r=parseInt(e.replace(/image-(\\d+)[a-z]+/i,"$1"));document.querySelectorAll(".reading-content .page-break")[r].appendChild(t)})),k=document.querySelectorAll(".reading-content .page-break img"),k.forEach((t=>{const e=t.getAttribute("id"),r=e.slice(-1);c+=r,t.setAttribute("id",e.slice(0,-1))})),k=document.querySelectorAll(".reading-content .page-break img"),k.forEach((t=>{const e=t.getAttribute("dta"),r=f(e,h().toString());t.setAttribute("dta",r)})),k=document.querySelectorAll(".reading-content .page-break img"),k.forEach((t=>{const e=t.getAttribute("dta").slice(-2);i+=e,t.removeAttribute("dta")})),k.forEach((t=>{var e=t.getAttribute("data-src"),r=f(e,y().toString());t.setAttribute("data-src",r)})),k.forEach((t=>{t.classList.add("wp-manga-chapter-img","img-responsive","lazyload","effect-fade")}))}})})();': () => {
        try {
            document.addEventListener("DOMContentLoaded", (() => {
                if (window.CryptoJSAesJson && window.CryptoJSAesJson.decrypt) {
                    const e = document.createElement("link");
                    function t() {
                        const t = document.querySelector(".entry-header.header");
                        return parseInt(t.getAttribute("data-id"));
                    }
                    e.setAttribute("rel", "stylesheet"), e.setAttribute("media", "all"), e.setAttribute("href", "/wp-content/cache/autoptimize/css/autoptimize_92c5b1cf0217cba9b3fab27d39f320b9.css"), 
                    document.head.appendChild(e);
                    const r = 3, n = 5, o = 13, a = "07";
                    let c = "", i = "";
                    const d = 1, l = 6, g = 1, s = 5, u = 2, m = 8, p = 8, b = (t, e) => parseInt(t.toString() + e.toString()), A = (t, e, r) => t.toString() + e.toString() + r.toString(), S = () => {
                        const e = document.querySelectorAll(".reading-content .page-break img").length;
                        let c = parseInt((t() + b(o, a)) * r - e);
                        return c = b(2 * n + 1, c), c;
                    }, h = () => {
                        const e = document.querySelectorAll(".reading-content .page-break img").length;
                        let r = parseInt((t() + b(m, p)) * (2 * d) - e - (2 * d * 2 + 1));
                        return r = A(2 * l + g + g + 1, c, r), r;
                    }, y = () => {
                        const e = document.querySelectorAll(".reading-content .page-break img").length;
                        return A(t() + 2 * s * 2, i, e * (2 * u));
                    }, f = (t, e) => CryptoJSAesJson.decrypt(t, e);
                    let k = document.querySelectorAll(".reading-content .page-break img");
                    k.forEach((t => {
                        const e = t.getAttribute("id"), r = f(e, S().toString());
                        t.setAttribute("id", r);
                    })), k = document.querySelectorAll(".reading-content .page-break img"), k.forEach((t => {
                        const e = t.getAttribute("id"), r = parseInt(e.replace(/image-(\d+)[a-z]+/i, "$1"));
                        document.querySelectorAll(".reading-content .page-break")[r].appendChild(t);
                    })), k = document.querySelectorAll(".reading-content .page-break img"), k.forEach((t => {
                        const e = t.getAttribute("id"), r = e.slice(-1);
                        c += r, t.setAttribute("id", e.slice(0, -1));
                    })), k = document.querySelectorAll(".reading-content .page-break img"), k.forEach((t => {
                        const e = t.getAttribute("dta"), r = f(e, h().toString());
                        t.setAttribute("dta", r);
                    })), k = document.querySelectorAll(".reading-content .page-break img"), k.forEach((t => {
                        const e = t.getAttribute("dta").slice(-2);
                        i += e, t.removeAttribute("dta");
                    })), k.forEach((t => {
                        var e = t.getAttribute("data-src"), r = f(e, y().toString());
                        t.setAttribute("data-src", r);
                    })), k.forEach((t => {
                        t.classList.add("wp-manga-chapter-img", "img-responsive", "lazyload", "effect-fade");
                    }));
                }
            }));
        } catch (t) {
            console.error("Error executing AG js: " + t);
        }
    },
    '(()=>{const e=new Map,t=function(){},o=t;o.prototype.dispose=t,o.prototype.setNetwork=t,o.prototype.resize=t,o.prototype.setServer=t,o.prototype.setLogLevel=t,o.prototype.newContext=function(){return this},o.prototype.setParameter=t,o.prototype.addEventListener=function(t,o){t&&(console.debug(`Type: ${t}, callback: ${o}`),e.set(t,o))},o.prototype.removeEventListener=t,o.prototype.setProfile=t,o.prototype.setCapability=t,o.prototype.setVideoAsset=t,o.prototype.setSiteSection=t,o.prototype.addKeyValue=t,o.prototype.addTemporalSlot=t,o.prototype.registerCustomPlayer=t,o.prototype.setVideoDisplaySize=t,o.prototype.setContentVideoElement=t,o.prototype.registerVideoDisplayBase=t,o.prototype.submitRequest=function(){const t={type:tv.freewheel.SDK.EVENT_SLOT_ENDED},o=e.get("EVENT_SLOT_ENDED");o&&setTimeout((()=>{try{o(t)}catch(e){console.error(e)}}),1)},window.tv={freewheel:{SDK:{Ad:t,AdManager:o,AdListener:t,_instanceQueue:{},setLogLevel:t,EVENT_SLOT_ENDED:"EVENT_SLOT_ENDED"}}}})();': () => {
        try {
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
        } catch (e) {
            console.error("Error executing AG js: " + e);
        }
    },
    '(()=>{const e=window.Promise,o={construct:(o,t,n)=>t[0]&&t[0]?.toString()?.includes("[!1,!1,!1,!1]")&&t[0]?.toString()?.includes(".responseText")?e.resolve(!1):Reflect.construct(o,t,n)},t=new Proxy(window.Promise,o);Object.defineProperty(window,"Promise",{set:e=>{},get:()=>t})})();': () => {
        try {
            (() => {
                const e = window.Promise, o = {
                    construct: (o, r, t) => r[0] && r[0]?.toString()?.includes("[!1,!1,!1,!1]") && r[0]?.toString()?.includes(".responseText") ? e.resolve(!1) : Reflect.construct(o, r, t)
                }, r = new Proxy(window.Promise, o);
                Object.defineProperty(window, "Promise", {
                    set: e => {},
                    get: () => r
                });
            })();
        } catch (e) {
            console.error("Error executing AG js: " + e);
        }
    },
    'function preventError(d){window.addEventListener("error",function(a){if(a.srcElement&&a.srcElement.src){const b=new RegExp(d);b.test(a.srcElement.src)&&(a.srcElement.onerror=function(){})}},!0)}preventError("^.");': () => {
        try {
            function preventError(r) {
                window.addEventListener("error", (function(e) {
                    if (e.srcElement && e.srcElement.src) {
                        new RegExp(r).test(e.srcElement.src) && (e.srcElement.onerror = function() {});
                    }
                }), !0);
            }
            preventError("^.");
        } catch (r) {
            console.error("Error executing AG js: " + r);
        }
    },
    "(()=>{window.viAPItag={init(){}}})();": () => {
        try {
            window.viAPItag = {
                init() {}
            };
        } catch (r) {
            console.error("Error executing AG js: " + r);
        }
    },
    '(()=>{document.addEventListener("DOMContentLoaded",(()=>{ "function"==typeof ViewModelBase&&"object"==typeof ViewModelBase.prototype&&"function"==typeof ViewModelBase.prototype.LoadBrandAdAsync&&(ViewModelBase.prototype.LoadBrandAdAsync=function(){}) }));})();': () => {
        try {
            document.addEventListener("DOMContentLoaded", (() => {
                "function" == typeof ViewModelBase && "object" == typeof ViewModelBase.prototype && "function" == typeof ViewModelBase.prototype.LoadBrandAdAsync && (ViewModelBase.prototype.LoadBrandAdAsync = function() {});
            }));
        } catch (e) {
            console.error("Error executing AG js: " + e);
        }
    },
    '(()=>{document.addEventListener("DOMContentLoaded",(()=>{ var a=document.querySelectorAll("ins.adsbygoogle");a.length&&a.forEach(a=>{var b=document.createElement("iframe");b.style="display: none !important;",a.setAttribute("data-ad-status","filled"),a.appendChild(b)}) }));})();': () => {
        try {
            document.addEventListener("DOMContentLoaded", (() => {
                var e = document.querySelectorAll("ins.adsbygoogle");
                e.length && e.forEach((e => {
                    var t = document.createElement("iframe");
                    t.style = "display: none !important;", e.setAttribute("data-ad-status", "filled"), 
                    e.appendChild(t);
                }));
            }));
        } catch (e) {
            console.error("Error executing AG js: " + e);
        }
    },
    '(function(){window.adnPopConfig={zoneId:"149"}})();': () => {
        try {
            window.adnPopConfig = {
                zoneId: "149"
            };
        } catch (o) {
            console.error("Error executing AG js: " + o);
        }
    },
    '!function(){window.adsbygoogle={loaded:!0,push:function(){"undefined"===typeof this.length&&(this.length=0,this.length+=1)}}}();': () => {
        try {
            window.adsbygoogle = {
                loaded: !0,
                push: function() {
                    void 0 === this.length && (this.length = 0, this.length += 1);
                }
            };
        } catch (o) {
            console.error("Error executing AG js: " + o);
        }
    },
    '(()=>{document.addEventListener("DOMContentLoaded",(()=>{ var b=new MutationObserver(function(){try{for(var a,d=function(c){for(var a="",d=0;d<c;d++)a+="0123456789".charAt(Math.floor(10*Math.random()));return a},e=document.querySelectorAll(".adsbygoogle, script[data-ad-client]"),f=0;f<e.length;f++)if(e[f].getAttribute("data-ad-client")){a=e[f].getAttribute("data-ad-client");break}if(a){var g=`<ins class="adsbygoogle" data-adsbygoogle-status="done" style="display: block; height: 200px; width: 200px;" data-ad-status="unfilled"><ins id="aswift_0_expand" style="border: none; height: 0px; width: 0px; margin: 0px; padding: 0px; position: relative; visibility: visible; background-color: transparent; display: inline-table;" tabindex="0" title="Advertisement" aria-label="Advertisement"><ins id="aswift_0_anchor" style="border: none; height: 0px; width: 0px; margin: 0px; padding: 0px; position: relative; visibility: visible; background-color: transparent; display: block;"><iframe id="aswift_0" name="aswift_0" style="left:0;position:absolute;top:0;border:0;width:200px;height:200px;" sandbox="allow-forms allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts allow-top-navigation-by-user-activation" frameborder="0" src="https://googleads.g.doubleclick.net/pagead/ads?client=${a}&amp;output=html&amp;adk=${d(10)}&amp;adf=${d(10)}&amp;lmt=${d(10)}&amp;plat=${d(100)};&amp;format=0x0&amp;url=${encodeURIComponent(document.location.href)}&amp;ea=0&amp;flash=0&amp;pra=5&amp;wgl=1&amp;uach=${d(100)}&amp;bpp=2&amp;bdt=${d(3)}&amp;idt=${d(3)}&amp;shv=r${d(8)}&amp;mjsv=m${d(8)}&amp;ptt=${d(1)}&amp;saldr=aa&amp;abxe=1&amp;nras=1&amp;correlator=${d(8)}&amp;frm=${d(2)}&amp;pv=2&amp;ga_vid=${d(10)}.${d(10)}&amp;ga_sid=${d(10)}&amp;ga_hid=${d(10)}&amp;ga_fc=0&amp;u_tz=${d(3)}&amp;u_his=8&amp;u_java=0&amp;u_h=${d(4)}&amp;u_w=${d(4)}&amp;u_ah=${d(4)}&amp;u_aw=${d(4)}&amp;u_cd=${d(2)}&amp;u_nplug=${d(1)}&amp;u_nmime=${d(1)}&amp;adx=-${d(8)}&amp;ady=-${d(8)}&amp;biw=${d(4)}&amp;bih=${d(4)}&amp;scr_x=0&amp;scr_y=0&amp;eid=${d(30)}&amp;oid=${d(1)}&amp;pvsid=${d(16)}&amp;pem=${d(3)}&amp;eae=${d(1)}&amp;fc=${d(4)}&amp;brdim=${d(20)}&amp;vis=1&amp;rsz=${d(6)}&amp;abl=NS&amp;fu=${d(4)}&amp;bc=${d(2)}&amp;ifi=1&amp;uci=a!1&amp;fsb=1&amp;dtd=128" marginwidth="0" marginheight="0" vspace="0" hspace="0" allowtransparency="true" scrolling="no" allowfullscreen="true" data-google-container-id="a!1" data-load-complete="true"></iframe></ins></ins></ins>`,h=document.querySelector("body > *"),j=document.querySelectorAll(".phpbb-ads-center > .adsbygoogle");h&&j.length&&(!h.querySelector("iframe#aswift_0")&&h.insertAdjacentHTML("afterend",g),j.forEach(a=>{a.querySelector("iframe#aswift_0")||(a.parentNode.style.height="200px",a.parentNode.style.width="200px",a.parentNode.innerHTML=g)}))}var k=document.querySelector(".page-body"),l=document.querySelectorAll(".adsbygoogle, .phpbb-ads-center");k&&!k.innerText.includes("deactivating your Ad-Blocker")&&l.length&&(l.forEach(a=>{a.remove()}),b.disconnect())}catch(a){}});b.observe(document,{childList:!0,subtree:!0}),setTimeout(function(){b.disconnect()},1E4) }));})();': () => {
        try {
            document.addEventListener("DOMContentLoaded", (() => {
                var a = new MutationObserver((function() {
                    try {
                        for (var e, t = function(a) {
                            for (var e = "", t = 0; t < a; t++) e += "0123456789".charAt(Math.floor(10 * Math.random()));
                            return e;
                        }, i = document.querySelectorAll(".adsbygoogle, script[data-ad-client]"), p = 0; p < i.length; p++) if (i[p].getAttribute("data-ad-client")) {
                            e = i[p].getAttribute("data-ad-client");
                            break;
                        }
                        if (e) {
                            var o = `<ins class="adsbygoogle" data-adsbygoogle-status="done" style="display: block; height: 200px; width: 200px;" data-ad-status="unfilled"><ins id="aswift_0_expand" style="border: none; height: 0px; width: 0px; margin: 0px; padding: 0px; position: relative; visibility: visible; background-color: transparent; display: inline-table;" tabindex="0" title="Advertisement" aria-label="Advertisement"><ins id="aswift_0_anchor" style="border: none; height: 0px; width: 0px; margin: 0px; padding: 0px; position: relative; visibility: visible; background-color: transparent; display: block;"><iframe id="aswift_0" name="aswift_0" style="left:0;position:absolute;top:0;border:0;width:200px;height:200px;" sandbox="allow-forms allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts allow-top-navigation-by-user-activation" frameborder="0" src="https://googleads.g.doubleclick.net/pagead/ads?client=${e}&amp;output=html&amp;adk=${t(10)}&amp;adf=${t(10)}&amp;lmt=${t(10)}&amp;plat=${t(100)};&amp;format=0x0&amp;url=${encodeURIComponent(document.location.href)}&amp;ea=0&amp;flash=0&amp;pra=5&amp;wgl=1&amp;uach=${t(100)}&amp;bpp=2&amp;bdt=${t(3)}&amp;idt=${t(3)}&amp;shv=r${t(8)}&amp;mjsv=m${t(8)}&amp;ptt=${t(1)}&amp;saldr=aa&amp;abxe=1&amp;nras=1&amp;correlator=${t(8)}&amp;frm=${t(2)}&amp;pv=2&amp;ga_vid=${t(10)}.${t(10)}&amp;ga_sid=${t(10)}&amp;ga_hid=${t(10)}&amp;ga_fc=0&amp;u_tz=${t(3)}&amp;u_his=8&amp;u_java=0&amp;u_h=${t(4)}&amp;u_w=${t(4)}&amp;u_ah=${t(4)}&amp;u_aw=${t(4)}&amp;u_cd=${t(2)}&amp;u_nplug=${t(1)}&amp;u_nmime=${t(1)}&amp;adx=-${t(8)}&amp;ady=-${t(8)}&amp;biw=${t(4)}&amp;bih=${t(4)}&amp;scr_x=0&amp;scr_y=0&amp;eid=${t(30)}&amp;oid=${t(1)}&amp;pvsid=${t(16)}&amp;pem=${t(3)}&amp;eae=${t(1)}&amp;fc=${t(4)}&amp;brdim=${t(20)}&amp;vis=1&amp;rsz=${t(6)}&amp;abl=NS&amp;fu=${t(4)}&amp;bc=${t(2)}&amp;ifi=1&amp;uci=a!1&amp;fsb=1&amp;dtd=128" marginwidth="0" marginheight="0" vspace="0" hspace="0" allowtransparency="true" scrolling="no" allowfullscreen="true" data-google-container-id="a!1" data-load-complete="true"></iframe></ins></ins></ins>`, r = document.querySelector("body > *"), n = document.querySelectorAll(".phpbb-ads-center > .adsbygoogle");
                            r && n.length && (!r.querySelector("iframe#aswift_0") && r.insertAdjacentHTML("afterend", o), 
                            n.forEach((a => {
                                a.querySelector("iframe#aswift_0") || (a.parentNode.style.height = "200px", a.parentNode.style.width = "200px", 
                                a.parentNode.innerHTML = o);
                            })));
                        }
                        var d = document.querySelector(".page-body"), m = document.querySelectorAll(".adsbygoogle, .phpbb-ads-center");
                        d && !d.innerText.includes("deactivating your Ad-Blocker") && m.length && (m.forEach((a => {
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
        } catch (a) {
            console.error("Error executing AG js: " + a);
        }
    },
    "window.adsbygoogle = { loaded: !0 };": () => {
        try {
            window.adsbygoogle = {
                loaded: !0
            };
        } catch (o) {
            console.error("Error executing AG js: " + o);
        }
    },
    '!function(){const e={apply:(e,l,t)=>{const o=t[0];return o?.includes(".b_ad,")?t[0]="#b_results":o?.includes(".b_restorableLink")&&(t[0]=".b_algo"),Reflect.apply(e,l,t)}};window.Element.prototype.querySelectorAll=new Proxy(window.Element.prototype.querySelectorAll,e)}();': () => {
        try {
            !function() {
                const e = {
                    apply: (e, r, o) => {
                        const t = o[0];
                        return t?.includes(".b_ad,") ? o[0] = "#b_results" : t?.includes(".b_restorableLink") && (o[0] = ".b_algo"), 
                        Reflect.apply(e, r, o);
                    }
                };
                window.Element.prototype.querySelectorAll = new Proxy(window.Element.prototype.querySelectorAll, e);
            }();
        } catch (e) {
            console.error("Error executing AG js: " + e);
        }
    },
    "(function(){var b=window.setTimeout;window.setTimeout=function(a,c){if(!/\\]\\.bab\\(window/.test(a.toString()))return b(a,c)};})();": () => {
        try {
            !function() {
                var t = window.setTimeout;
                window.setTimeout = function(o, n) {
                    if (!/\]\.bab\(window/.test(o.toString())) return t(o, n);
                };
            }();
        } catch (t) {
            console.error("Error executing AG js: " + t);
        }
    },
    '(function(){var b=window.addEventListener;window.addEventListener=function(c,a,d){if(a&&-1==a.toString().indexOf("adblocker"))return b(c,a,d)}.bind(window)})();': () => {
        try {
            !function() {
                var n = window.addEventListener;
                window.addEventListener = function(r, e, i) {
                    if (e && -1 == e.toString().indexOf("adblocker")) return n(r, e, i);
                }.bind(window);
            }();
        } catch (n) {
            console.error("Error executing AG js: " + n);
        }
    },
    "(function(){var b=window.setInterval;window.setInterval=function(a,c){if(!/.\\.display=='hidden'[\\s\\S]*?.\\.visibility=='none'/.test(a.toString()))return b(a,c)}.bind(window)})();": () => {
        try {
            !function() {
                var n = window.setInterval;
                window.setInterval = function(i, t) {
                    if (!/.\.display=='hidden'[\s\S]*?.\.visibility=='none'/.test(i.toString())) return n(i, t);
                }.bind(window);
            }();
        } catch (n) {
            console.error("Error executing AG js: " + n);
        }
    },
    "(function(){var b=window.setInterval;window.setInterval=function(a,c){if(!/e\\.display=='hidden'[\\s\\S]*?e\\.visibility=='none'/.test(a.toString()))return b(a,c)}.bind(window)})();": () => {
        try {
            !function() {
                var n = window.setInterval;
                window.setInterval = function(i, t) {
                    if (!/e\.display=='hidden'[\s\S]*?e\.visibility=='none'/.test(i.toString())) return n(i, t);
                }.bind(window);
            }();
        } catch (n) {
            console.error("Error executing AG js: " + n);
        }
    },
    "window.cRAds = !0;": () => {
        try {
            window.cRAds = !0;
        } catch (r) {
            console.error("Error executing AG js: " + r);
        }
    },
    "window.spoof_weer2edasfgeefzc = true;": () => {
        try {
            window.spoof_weer2edasfgeefzc = !0;
        } catch (e) {
            console.error("Error executing AG js: " + e);
        }
    },
    "window.$tieE3 = true;": () => {
        try {
            window.$tieE3 = !0;
        } catch (r) {
            console.error("Error executing AG js: " + r);
        }
    },
    "window.adblock = 'no';": () => {
        try {
            window.adblock = "no";
        } catch (o) {
            console.error("Error executing AG js: " + o);
        }
    },
    "window.cRAds = true;": () => {
        try {
            window.cRAds = !0;
        } catch (r) {
            console.error("Error executing AG js: " + r);
        }
    },
    "window.Advertisement = 1;": () => {
        try {
            window.Advertisement = 1;
        } catch (r) {
            console.error("Error executing AG js: " + r);
        }
    },
    "(function(){var b=window.setTimeout;window.setTimeout=function(a,c){if(!/getAdIFrameCount/.test(a.toString()))return b(a,c)};})();": () => {
        try {
            !function() {
                var t = window.setTimeout;
                window.setTimeout = function(e, o) {
                    if (!/getAdIFrameCount/.test(e.toString())) return t(e, o);
                };
            }();
        } catch (t) {
            console.error("Error executing AG js: " + t);
        }
    },
    "window.check_adblock = true;": () => {
        try {
            window.check_adblock = !0;
        } catch (c) {
            console.error("Error executing AG js: " + c);
        }
    },
    "window.isAdsDisplayed = true;": () => {
        try {
            window.isAdsDisplayed = !0;
        } catch (r) {
            console.error("Error executing AG js: " + r);
        }
    },
    "window.adBlockDetected = false;": () => {
        try {
            window.adBlockDetected = !1;
        } catch (e) {
            console.error("Error executing AG js: " + e);
        }
    },
    "window.adsEnabled = true;": () => {
        try {
            window.adsEnabled = !0;
        } catch (r) {
            console.error("Error executing AG js: " + r);
        }
    },
    "(function(){var b=window.setTimeout;window.setTimeout=function(a,c){if(!/adblock.html/.test(a.toString()))return b(a,c)};})();": () => {
        try {
            !function() {
                var t = window.setTimeout;
                window.setTimeout = function(o, r) {
                    if (!/adblock.html/.test(o.toString())) return t(o, r);
                };
            }();
        } catch (t) {
            console.error("Error executing AG js: " + t);
        }
    },
    "window.uabpdl = window.uabInject = true;": () => {
        try {
            window.uabpdl = window.uabInject = !0;
        } catch (r) {
            console.error("Error executing AG js: " + r);
        }
    },
    'window.ads = "on";': () => {
        try {
            window.ads = "on";
        } catch (r) {
            console.error("Error executing AG js: " + r);
        }
    },
    "window.detector_active = true;": () => {
        try {
            window.detector_active = !0;
        } catch (r) {
            console.error("Error executing AG js: " + r);
        }
    },
    "window.adblock = 1;": () => {
        try {
            window.adblock = 1;
        } catch (r) {
            console.error("Error executing AG js: " + r);
        }
    },
    'var _st = window.setTimeout; window.setTimeout = function(a, b) { if(!/document\\.querySelector\\("ins\\.adsbygoogle"\\)/.test(a)){ _st(a,b);}};': () => {
        try {
            var _st = window.setTimeout;
            window.setTimeout = function(e, t) {
                /document\.querySelector\("ins\.adsbygoogle"\)/.test(e) || _st(e, t);
            };
        } catch (e) {
            console.error("Error executing AG js: " + e);
        }
    },
    "window.showAds = 1;": () => {
        try {
            window.showAds = 1;
        } catch (r) {
            console.error("Error executing AG js: " + r);
        }
    },
    "(function(){var b=window.setTimeout;window.setTimeout=function(a,c){if(!/ad-free subscription/.test(a.toString()))return b(a,c)};})();": () => {
        try {
            !function() {
                var t = window.setTimeout;
                window.setTimeout = function(r, e) {
                    if (!/ad-free subscription/.test(r.toString())) return t(r, e);
                };
            }();
        } catch (t) {
            console.error("Error executing AG js: " + t);
        }
    },
    "window.popns = true;": () => {
        try {
            window.popns = !0;
        } catch (r) {
            console.error("Error executing AG js: " + r);
        }
    },
    "window.adBlock = false;": () => {
        try {
            window.adBlock = !1;
        } catch (r) {
            console.error("Error executing AG js: " + r);
        }
    },
    "(function(){var b=window.setTimeout;window.setTimeout=function(a,c){if(!/\\!document\\.getElementById[\\s\\S]*?#updato-overlay/.test(a.toString()))return b(a,c)};})();": () => {
        try {
            !function() {
                var t = window.setTimeout;
                window.setTimeout = function(e, o) {
                    if (!/\!document\.getElementById[\s\S]*?#updato-overlay/.test(e.toString())) return t(e, o);
                };
            }();
        } catch (t) {
            console.error("Error executing AG js: " + t);
        }
    },
    "var _st = window.setTimeout; window.setTimeout = function(a, b) { if(!/document\\.getElementById\\('cootent'\\)\\.innerHTML=/.test(a)){ _st(a,b);}};": () => {
        try {
            var _st = window.setTimeout;
            window.setTimeout = function(t, e) {
                /document\.getElementById\('cootent'\)\.innerHTML=/.test(t) || _st(t, e);
            };
        } catch (t) {
            console.error("Error executing AG js: " + t);
        }
    },
    "window.areAdsDisplayed = true;": () => {
        try {
            window.areAdsDisplayed = !0;
        } catch (r) {
            console.error("Error executing AG js: " + r);
        }
    },
    "window.Adv_ab = false;": () => {
        try {
            window.Adv_ab = !1;
        } catch (r) {
            console.error("Error executing AG js: " + r);
        }
    },
    "var _st = window.setTimeout; window.setTimeout = function(a, b) { if(!/isAdsBlocked/.test(a)){ _st(a,b);}};": () => {
        try {
            var _st = window.setTimeout;
            window.setTimeout = function(t, e) {
                /isAdsBlocked/.test(t) || _st(t, e);
            };
        } catch (t) {
            console.error("Error executing AG js: " + t);
        }
    },
    "window.adsEnabled=!0;": () => {
        try {
            window.adsEnabled = !0;
        } catch (r) {
            console.error("Error executing AG js: " + r);
        }
    },
    "window.showads=true;": () => {
        try {
            window.showads = !0;
        } catch (r) {
            console.error("Error executing AG js: " + r);
        }
    },
    "var _st = window.setTimeout; window.setTimeout = function(a, b) { if(!/_detectAdBlocker/.test(a)){ _st(a,b);}};": () => {
        try {
            var _st = window.setTimeout;
            window.setTimeout = function(t, e) {
                /_detectAdBlocker/.test(t) || _st(t, e);
            };
        } catch (t) {
            console.error("Error executing AG js: " + t);
        }
    },
    '(function(o,a){o(window,"FTBAds",{get:function(){return a},set:function(b){a=b;o(a,"ads",{value:!1})}})})(Object.defineProperty);': () => {
        try {
            !function(e, n) {
                e(window, "FTBAds", {
                    get: function() {
                        return n;
                    },
                    set: function(r) {
                        e(n = r, "ads", {
                            value: !1
                        });
                    }
                });
            }(Object.defineProperty);
        } catch (e) {
            console.error("Error executing AG js: " + e);
        }
    },
    "(function(c,b){Object.defineProperties(window,{dataLayer:c,dataLayer_gtm:c})})({set:function(a){a&&a[0]&&(a[0].AdBlockerDetected=!1);b=a},get:function(){return b},enumerable:!0});": () => {
        try {
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
        } catch (e) {
            console.error("Error executing AG js: " + e);
        }
    },
    '(function(a){setTimeout=function(){var b="function"==typeof arguments[0]?Function.prototype.toString.call(arguments[0]):"string"==typeof arguments[0]?arguments[0]:String(arguments[0]);return/\\[(_0x[a-z0-9]{4,})\\[\\d+\\]\\][\\[\\(]\\1\\[\\d+\\]/.test(b)?NaN:a.apply(window,arguments)}.bind();Object.defineProperty(setTimeout,"name",{value:a.name});setTimeout.toString=Function.prototype.toString.bind(a)})(setTimeout);': () => {
        try {
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
        } catch (t) {
            console.error("Error executing AG js: " + t);
        }
    },
    '(function(b,c){setTimeout=function(){var a=arguments[0];if("function"==typeof a&&/^function [A-Za-z]{1,2}\\(\\)\\s*\\{([A-Za-z])\\|\\|\\(\\1=!0,[\\s\\S]{1,13}\\(\\)\\)\\}$/.test(c.call(a)))throw"Adguard stopped a script execution.";return b.apply(window,arguments)}})(setTimeout,Function.prototype.toString);': () => {
        try {
            !function(t, o) {
                setTimeout = function() {
                    var n = arguments[0];
                    if ("function" == typeof n && /^function [A-Za-z]{1,2}\(\)\s*\{([A-Za-z])\|\|\(\1=!0,[\s\S]{1,13}\(\)\)\}$/.test(o.call(n))) throw "Adguard stopped a script execution.";
                    return t.apply(window, arguments);
                };
            }(setTimeout, Function.prototype.toString);
        } catch (t) {
            console.error("Error executing AG js: " + t);
        }
    },
    "window.sessionStorage.loadedAds = 3;": () => {
        try {
            window.sessionStorage.loadedAds = 3;
        } catch (o) {
            console.error("Error executing AG js: " + o);
        }
    },
    "window.call_Ad = function() { };": () => {
        try {
            window.call_Ad = function() {};
        } catch (r) {
            console.error("Error executing AG js: " + r);
        }
    },
    "window.RunAds = !0;": () => {
        try {
            window.RunAds = !0;
        } catch (r) {
            console.error("Error executing AG js: " + r);
        }
    },
    "window._r3z = {}; Object.defineProperties(window._r3z, { jq: { value: undefined }, pub: { value: {} } });": () => {
        try {
            window._r3z = {};
            Object.defineProperties(window._r3z, {
                jq: {
                    value: void 0
                },
                pub: {
                    value: {}
                }
            });
        } catch (e) {
            console.error("Error executing AG js: " + e);
        }
    },
    "(function() { window.xRds = false; window.frg = true; window.frag = true;  })();": () => {
        try {
            !function() {
                window.xRds = !1;
                window.frg = !0;
                window.frag = !0;
            }();
        } catch (r) {
            console.error("Error executing AG js: " + r);
        }
    },
    "window.canABP = true;": () => {
        try {
            window.canABP = !0;
        } catch (r) {
            console.error("Error executing AG js: " + r);
        }
    },
    "var _st = window.setTimeout; window.setTimeout = function(a, b) { if(!/displayAdBlockedVideo/.test(a)){ _st(a,b);}};": () => {
        try {
            var _st = window.setTimeout;
            window.setTimeout = function(t, e) {
                /displayAdBlockedVideo/.test(t) || _st(t, e);
            };
        } catch (t) {
            console.error("Error executing AG js: " + t);
        }
    },
    "(function(){var b=window.setTimeout;window.setTimeout=function(a,c){if(!/adsbygoogle instanceof Array/.test(a.toString()))return b(a,c)};})();": () => {
        try {
            !function() {
                var t = window.setTimeout;
                window.setTimeout = function(o, r) {
                    if (!/adsbygoogle instanceof Array/.test(o.toString())) return t(o, r);
                };
            }();
        } catch (t) {
            console.error("Error executing AG js: " + t);
        }
    },
    'window.ad_permission = "OK";': () => {
        try {
            window.ad_permission = "OK";
        } catch (r) {
            console.error("Error executing AG js: " + r);
        }
    },
    "(function(){var b=window.setTimeout;window.setTimeout=function(a,c){if(!/new Image\\(\\);s\\.onerror=function/.test(a.toString()))return b(a,c)};})();": () => {
        try {
            !function() {
                var t = window.setTimeout;
                window.setTimeout = function(n, o) {
                    if (!/new Image\(\);s\.onerror=function/.test(n.toString())) return t(n, o);
                };
            }();
        } catch (t) {
            console.error("Error executing AG js: " + t);
        }
    },
    'document.cookie="popunder=1; path=/;";': () => {
        try {
            document.cookie = "popunder=1; path=/;";
        } catch (o) {
            console.error("Error executing AG js: " + o);
        }
    },
    "!function(){if(location.pathname.indexOf(\"/iframe/player\")===-1){Object.defineProperty(Object.prototype, 'kununu_mul', { get: function(){ throw null; }, set: function(){ throw null; }});}}();": () => {
        try {
            -1 === location.pathname.indexOf("/iframe/player") && Object.defineProperty(Object.prototype, "kununu_mul", {
                get: function() {
                    throw null;
                },
                set: function() {
                    throw null;
                }
            });
        } catch (e) {
            console.error("Error executing AG js: " + e);
        }
    },
    '!function(){const r={apply:(r,o,e)=>(e[0]?.includes?.("{}")&&(e[0]="<?xml version=\\"1.0\\" encoding=\\"UTF-8\\"?>\\n<vmap:VMAP version=\\"1.0\\" xmlns:vmap=\\"http://www.iab.net/videosuite/vmap\\"><vmap:AdBreak timeOffset=\\"start\\" breakType=\\"linear\\" breakId=\\"4f95e542-9da8-480e-8c2a-7ade1ffdcc3d\\"><vmap:AdSource allowMultipleAds=\\"true\\" followRedirects=\\"true\\"><vmap:VASTAdData></vmap:VASTAdData></vmap:AdSource></vmap:AdBreak></vmap:VMAP>"),Reflect.apply(r,o,e))};window.DOMParser.prototype.parseFromString=new Proxy(window.DOMParser.prototype.parseFromString,r)}();': () => {
        try {
            !function() {
                const e = {
                    apply: (e, r, a) => (a[0]?.includes?.("{}") && (a[0] = '<?xml version="1.0" encoding="UTF-8"?>\n<vmap:VMAP version="1.0" xmlns:vmap="http://www.iab.net/videosuite/vmap"><vmap:AdBreak timeOffset="start" breakType="linear" breakId="4f95e542-9da8-480e-8c2a-7ade1ffdcc3d"><vmap:AdSource allowMultipleAds="true" followRedirects="true"><vmap:VASTAdData></vmap:VASTAdData></vmap:AdSource></vmap:AdBreak></vmap:VMAP>'), 
                    Reflect.apply(e, r, a))
                };
                window.DOMParser.prototype.parseFromString = new Proxy(window.DOMParser.prototype.parseFromString, e);
            }();
        } catch (e) {
            console.error("Error executing AG js: " + e);
        }
    },
    '(()=>{window.googletag={apiReady:!0,getVersion:function(){return"202307200101"}};})();': () => {
        try {
            window.googletag = {
                apiReady: !0,
                getVersion: function() {
                    return "202307200101";
                }
            };
        } catch (r) {
            console.error("Error executing AG js: " + r);
        }
    },
    '!function(){const e={apply:(e,t,n)=>{if("prg"!==t?.id)return Reflect.apply(e,t,n);const o=Reflect.apply(e,t,n);return Object.defineProperty(o,"top",{value:500}),o}};window.Element.prototype.getBoundingClientRect=new Proxy(window.Element.prototype.getBoundingClientRect,e)}();': () => {
        try {
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
        } catch (e) {
            console.error("Error executing AG js: " + e);
        }
    },
    "window.atob = function() { };": () => {
        try {
            window.atob = function() {};
        } catch (o) {
            console.error("Error executing AG js: " + o);
        }
    },
    "window.canABP = window.canRunAds = window.canCheckAds = true;": () => {
        try {
            window.canABP = window.canRunAds = window.canCheckAds = !0;
        } catch (n) {
            console.error("Error executing AG js: " + n);
        }
    },
    "window.canRun = true;": () => {
        try {
            window.canRun = !0;
        } catch (r) {
            console.error("Error executing AG js: " + r);
        }
    },
    'window.googleToken = "no";': () => {
        try {
            window.googleToken = "no";
        } catch (o) {
            console.error("Error executing AG js: " + o);
        }
    },
    "window.my_random_number = 1;": () => {
        try {
            window.my_random_number = 1;
        } catch (r) {
            console.error("Error executing AG js: " + r);
        }
    },
    "(function(){var b=window.setTimeout;window.setTimeout=function(a,c){if(!/\\[_0x/.test(a.toString()))return b(a,c)};})();": () => {
        try {
            !function() {
                var t = window.setTimeout;
                window.setTimeout = function(o, r) {
                    if (!/\[_0x/.test(o.toString())) return t(o, r);
                };
            }();
        } catch (t) {
            console.error("Error executing AG js: " + t);
        }
    },
    "(()=>{window.com_adswizz_synchro_decorateUrl=(a)=>a;})();": () => {
        try {
            window.com_adswizz_synchro_decorateUrl = r => r;
        } catch (r) {
            console.error("Error executing AG js: " + r);
        }
    },
    '(()=>{document.addEventListener(\'DOMContentLoaded\',()=>{var a=document.querySelector("body");document.location.hostname.includes("skmedix.pl")&&a&&a.insertAdjacentHTML("beforeend",\'<ins class="adsbygoogle" data-ad-status="filled"><div id="aswift_" style="position: absolute !important; left: -3000px !important;"><iframe id="aswift_"></iframe></div></ins><iframe src="/aframe"></iframe>\')})})();': () => {
        try {
            document.addEventListener("DOMContentLoaded", (() => {
                var e = document.querySelector("body");
                document.location.hostname.includes("skmedix.pl") && e && e.insertAdjacentHTML("beforeend", '<ins class="adsbygoogle" data-ad-status="filled"><div id="aswift_" style="position: absolute !important; left: -3000px !important;"><iframe id="aswift_"></iframe></div></ins><iframe src="/aframe"></iframe>');
            }));
        } catch (e) {
            console.error("Error executing AG js: " + e);
        }
    },
    '(()=>{document.addEventListener("DOMContentLoaded",(()=>{   setTimeout(function() { if(typeof show_game_iframe === "function") { show_game_iframe(); } }, 1000); }));})();': () => {
        try {
            document.addEventListener("DOMContentLoaded", (() => {
                setTimeout((function() {
                    "function" == typeof show_game_iframe && show_game_iframe();
                }), 1e3);
            }));
        } catch (e) {
            console.error("Error executing AG js: " + e);
        }
    },
    '(()=>{window.sas_idmnet=window.sas_idmnet||{};Object.assign(sas_idmnet,{releaseVideo:function(a){if("object"==typeof videoInit&&"function"==typeof videoInit.start)try{videoInit.start(a,n)}catch(a){}},release:function(){},placementsList:function(){}});const a=function(a,b){if(a&&a.push)for(a.push=b;a.length;)b(a.shift())},b=function(a){try{a()}catch(a){console.error(a)}};"complete"===document.readyState?a(sas_idmnet.cmd,b):window.addEventListener("load",()=>{a(sas_idmnet.cmd,b)})})();': () => {
        try {
            (() => {
                window.sas_idmnet = window.sas_idmnet || {};
                Object.assign(sas_idmnet, {
                    releaseVideo: function(t) {
                        if ("object" == typeof videoInit && "function" == typeof videoInit.start) try {
                            videoInit.start(t, n);
                        } catch (t) {}
                    },
                    release: function() {},
                    placementsList: function() {}
                });
                const t = function(t, e) {
                    if (t && t.push) for (t.push = e; t.length; ) e(t.shift());
                }, e = function(t) {
                    try {
                        t();
                    } catch (t) {
                        console.error(t);
                    }
                };
                "complete" === document.readyState ? t(sas_idmnet.cmd, e) : window.addEventListener("load", (() => {
                    t(sas_idmnet.cmd, e);
                }));
            })();
        } catch (t) {
            console.error("Error executing AG js: " + t);
        }
    },
    "!function(){window.YLHH={bidder:{startAuction:function(){}}};}();": () => {
        try {
            window.YLHH = {
                bidder: {
                    startAuction: function() {}
                }
            };
        } catch (r) {
            console.error("Error executing AG js: " + r);
        }
    },
    "(function(){var c=window.setTimeout;window.setTimeout=function(f,g){return g===1e3&&/#kam-ban-player/.test(f.toString())&&(g*=0.01),c.apply(this,arguments)}.bind(window)})();": () => {
        try {
            !function() {
                var t = window.setTimeout;
                window.setTimeout = function(n, e) {
                    return 1e3 === e && /#kam-ban-player/.test(n.toString()) && (e *= .01), t.apply(this, arguments);
                }.bind(window);
            }();
        } catch (t) {
            console.error("Error executing AG js: " + t);
        }
    },
    '(()=>{const t=Object.getOwnPropertyDescriptor,e={apply:(e,n,r)=>{const o=r[0];if(o?.toString?.()?.includes("EventTarget")){const e=t(o,"addEventListener");e?.set?.toString&&(e.set.toString=function(){}),e?.get?.toString&&(e.get.toString=function(){})}return Reflect.apply(e,n,r)}};window.Object.getOwnPropertyDescriptors=new Proxy(window.Object.getOwnPropertyDescriptors,e)})();': () => {
        try {
            (() => {
                const t = Object.getOwnPropertyDescriptor, e = {
                    apply: (e, r, n) => {
                        const o = n[0];
                        if (o?.toString?.()?.includes("EventTarget")) {
                            const e = t(o, "addEventListener");
                            e?.set?.toString && (e.set.toString = function() {}), e?.get?.toString && (e.get.toString = function() {});
                        }
                        return Reflect.apply(e, r, n);
                    }
                };
                window.Object.getOwnPropertyDescriptors = new Proxy(window.Object.getOwnPropertyDescriptors, e);
            })();
        } catch (t) {
            console.error("Error executing AG js: " + t);
        }
    },
    '(()=>{Object.defineProperty=new Proxy(Object.defineProperty,{apply:(e,t,n)=>{const r=new Set(["VP","w3","JW"]),o=n[1],c=n[2]?.get;return o&&r.has(o)&&"function"==typeof c&&c.toString().includes("()=>i")&&(n[2].get=function(){return function(){return!1}}),Reflect.apply(e,t,n)}});})();': () => {
        try {
            Object.defineProperty = new Proxy(Object.defineProperty, {
                apply: (e, t, r) => {
                    const n = new Set([ "VP", "w3", "JW" ]), o = r[1], c = r[2]?.get;
                    return o && n.has(o) && "function" == typeof c && c.toString().includes("()=>i") && (r[2].get = function() {
                        return function() {
                            return !1;
                        };
                    }), Reflect.apply(e, t, r);
                }
            });
        } catch (e) {
            console.error("Error executing AG js: " + e);
        }
    },
    "window.showAds = true;": () => {
        try {
            window.showAds = !0;
        } catch (r) {
            console.error("Error executing AG js: " + r);
        }
    },
    "window.uabpInject = function() {};": () => {
        try {
            window.uabpInject = function() {};
        } catch (r) {
            console.error("Error executing AG js: " + r);
        }
    },
    "(function(){var b=window.setTimeout;window.setTimeout=function(a,c){if(!/checkAds\\(\\);/.test(a.toString()))return b(a,c)};})();": () => {
        try {
            !function() {
                var t = window.setTimeout;
                window.setTimeout = function(e, o) {
                    if (!/checkAds\(\);/.test(e.toString())) return t(e, o);
                };
            }();
        } catch (t) {
            console.error("Error executing AG js: " + t);
        }
    },
    "window.adblock = true;": () => {
        try {
            window.adblock = !0;
        } catch (r) {
            console.error("Error executing AG js: " + r);
        }
    },
    "window.ads_unblocked = true;": () => {
        try {
            window.ads_unblocked = !0;
        } catch (r) {
            console.error("Error executing AG js: " + r);
        }
    },
    '!function(){const r={apply:(r,o,e)=>(e[0]?.includes?.("</VAST>")&&(e[0]=""),Reflect.apply(r,o,e))};window.DOMParser.prototype.parseFromString=new Proxy(window.DOMParser.prototype.parseFromString,r)}();': () => {
        try {
            !function() {
                const r = {
                    apply: (r, o, e) => (e[0]?.includes?.("</VAST>") && (e[0] = ""), Reflect.apply(r, o, e))
                };
                window.DOMParser.prototype.parseFromString = new Proxy(window.DOMParser.prototype.parseFromString, r);
            }();
        } catch (r) {
            console.error("Error executing AG js: " + r);
        }
    },
    "window.adsOk = !0;": () => {
        try {
            window.adsOk = !0;
        } catch (r) {
            console.error("Error executing AG js: " + r);
        }
    },
    "window.ads_ok = true;": () => {
        try {
            window.ads_ok = !0;
        } catch (r) {
            console.error("Error executing AG js: " + r);
        }
    },
    '(()=>{const t={construct:(t,n,o)=>{const e=n[0],s=e?.toString(),c=s?.includes("await this.whenGDPRClosed()");return c&&(n[0]=t=>t(!0)),Reflect.construct(t,n,o)}};window.Promise=new Proxy(window.Promise,t)})();': () => {
        try {
            (() => {
                const o = {
                    construct: (o, r, t) => {
                        const e = r[0], n = e?.toString(), c = n?.includes("await this.whenGDPRClosed()");
                        return c && (r[0] = o => o(!0)), Reflect.construct(o, r, t);
                    }
                };
                window.Promise = new Proxy(window.Promise, o);
            })();
        } catch (o) {
            console.error("Error executing AG js: " + o);
        }
    },
    "(function(){var b=window.setTimeout;window.setTimeout=function(a,c){if(!/notDetectedBy/.test(a.toString()))return b(a,c)};})();": () => {
        try {
            !function() {
                var t = window.setTimeout;
                window.setTimeout = function(e, o) {
                    if (!/notDetectedBy/.test(e.toString())) return t(e, o);
                };
            }();
        } catch (t) {
            console.error("Error executing AG js: " + t);
        }
    },
    "window.adBlockTest = true;": () => {
        try {
            window.adBlockTest = !0;
        } catch (r) {
            console.error("Error executing AG js: " + r);
        }
    },
    '(function(){var b=XMLHttpRequest.prototype.open,c=/ib\\.adnxs\\.com/i;XMLHttpRequest.prototype.open=function(d,a){if("POST"===d&&c.test(a))this.send=function(){return null},this.setRequestHeader=function(){return null},console.log("AG has blocked request: ",a);else return b.apply(this,arguments)}})();': () => {
        try {
            !function() {
                var t = XMLHttpRequest.prototype.open, e = /ib\.adnxs\.com/i;
                XMLHttpRequest.prototype.open = function(n, o) {
                    if ("POST" !== n || !e.test(o)) return t.apply(this, arguments);
                    this.send = function() {
                        return null;
                    }, this.setRequestHeader = function() {
                        return null;
                    }, console.log("AG has blocked request: ", o);
                };
            }();
        } catch (t) {
            console.error("Error executing AG js: " + t);
        }
    },
    '!function(){if(location.pathname.includes("/source/playerads")){var b=new MutationObserver(function(){var a=document.querySelector(\'script[type="text/javascript"]\');a&&a.textContent.includes(\'"ads": [\')&&(b.disconnect(),a.textContent=a.textContent.replace(/("ads": \\[\\{)[\\s\\S]*?(\\}\\])/,"$1$2"))});b.observe(document,{childList:!0,subtree:!0})}}();': () => {
        try {
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
        } catch (e) {
            console.error("Error executing AG js: " + e);
        }
    },
    "clientSide.player.play(true);": () => {
        try {
            clientSide.player.play(!0);
        } catch (r) {
            console.error("Error executing AG js: " + r);
        }
    },
    '(()=>{if(location.href.includes("/embed/?link=")){const i=new URL(location.href).searchParams.get("link");if(i)try{location.assign(i)}catch(i){}}})();': () => {
        try {
            (() => {
                if (location.href.includes("/embed/?link=")) {
                    const c = new URL(location.href).searchParams.get("link");
                    if (c) try {
                        location.assign(c);
                    } catch (c) {}
                }
            })();
        } catch (c) {
            console.error("Error executing AG js: " + c);
        }
    },
    "(function(){Object.defineProperty(window, 'ExoLoader', { get: function() { return; } }); var c=document.addEventListener;document.addEventListener=function(a,b,d,e){\"getexoloader\"!=a&&-1==b.toString().indexOf('loader')&&c(a,b,d,e)}.bind(document);})();": () => {
        try {
            !function() {
                Object.defineProperty(window, "ExoLoader", {
                    get: function() {}
                });
                var e = document.addEventListener;
                document.addEventListener = function(n, t, o, r) {
                    "getexoloader" != n && -1 == t.toString().indexOf("loader") && e(n, t, o, r);
                }.bind(document);
            }();
        } catch (e) {
            console.error("Error executing AG js: " + e);
        }
    },
    '(()=>{if(window.self!==window.top)try{if("object"==typeof localStorage)return}catch(a){delete window.localStorage,window.localStorage={setItem(){},getItem(){},removeItem(){},clear(){}}}})();': () => {
        try {
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
        } catch (e) {
            console.error("Error executing AG js: " + e);
        }
    },
    '(()=>{window.Bolt={on:(o,n,i)=>{"precontent_ad_video"===o&&"AD_COMPLETE"===n&&"function"==typeof i&&i()},BOLT_AD_COMPLETE:"AD_COMPLETE",BOLT_AD_ERROR:"AD_ERROR"},window.ramp=window.ramp||{},window.ramp.addUnits=()=>Promise.resolve(),window.ramp.displayUnits=()=>{setTimeout((()=>{"function"==typeof window.ramp.onPlayerReady&&window.ramp.onPlayerReady()}),1)};})();': () => {
        try {
            window.Bolt = {
                on: (o, n, e) => {
                    "precontent_ad_video" === o && "AD_COMPLETE" === n && "function" == typeof e && e();
                },
                BOLT_AD_COMPLETE: "AD_COMPLETE",
                BOLT_AD_ERROR: "AD_ERROR"
            }, window.ramp = window.ramp || {}, window.ramp.addUnits = () => Promise.resolve(), 
            window.ramp.displayUnits = () => {
                setTimeout((() => {
                    "function" == typeof window.ramp.onPlayerReady && window.ramp.onPlayerReady();
                }), 1);
            };
        } catch (o) {
            console.error("Error executing AG js: " + o);
        }
    },
    '(()=>{const e={apply:(e,t,o)=>(o[0]=!0,Reflect.apply(e,t,o))};let t,o=!1;Object.defineProperty(window,"ig",{get:function(){return"function"!=typeof t?.RetentionRewardedVideo?.prototype?.rewardedVideoResult||o||(t.RetentionRewardedVideo.prototype.rewardedVideoResult=new Proxy(t.RetentionRewardedVideo.prototype.rewardedVideoResult,e),o=!0),t},set:function(e){t=e}})})();': () => {
        try {
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
        } catch (e) {
            console.error("Error executing AG js: " + e);
        }
    },
    '(()=>{let e,n=!1;const t=function(){};Object.defineProperty(window,"videojs",{get:function(){return e},set:function(o){e=o,!n&&e&&"function"==typeof e.registerPlugin&&(n=!0,e.registerPlugin("skipIma3Unskippable",t))}}),window.SlotTypeEnum={},window.ANAWeb=function(){},window.ANAWeb.prototype.createVideoSlot=function(){},window.ANAWeb.prototype.createSlot=function(){},window.ANAWeb.VideoPlayerType={},window.addEventListener("load",(function(){document.dispatchEvent(new CustomEvent("ANAReady"))}))})();': () => {
        try {
            (() => {
                let e, n = !1;
                const t = function() {};
                Object.defineProperty(window, "videojs", {
                    get: function() {
                        return e;
                    },
                    set: function(o) {
                        e = o, !n && e && "function" == typeof e.registerPlugin && (n = !0, e.registerPlugin("skipIma3Unskippable", t));
                    }
                }), window.SlotTypeEnum = {}, window.ANAWeb = function() {}, window.ANAWeb.prototype.createVideoSlot = function() {}, 
                window.ANAWeb.prototype.createSlot = function() {}, window.ANAWeb.VideoPlayerType = {}, 
                window.addEventListener("load", (function() {
                    document.dispatchEvent(new CustomEvent("ANAReady"));
                }));
            })();
        } catch (e) {
            console.error("Error executing AG js: " + e);
        }
    },
    '(()=>{const a=function(){};window.apstag={fetchBids(c,a){"function"==typeof a&&a([])},init:a,setDisplayBids:a,targetingKeys:a}})();': () => {
        try {
            (() => {
                const t = function() {};
                window.apstag = {
                    fetchBids(t, i) {
                        "function" == typeof i && i([]);
                    },
                    init: t,
                    setDisplayBids: t,
                    targetingKeys: t
                };
            })();
        } catch (t) {
            console.error("Error executing AG js: " + t);
        }
    },
    '(()=>{window.JSON.parse=new Proxy(JSON.parse,{apply(r,e,t){const s=Reflect.apply(r,e,t),l=s?.results;try{if(l&&Array.isArray(l))s?.results&&(s.results=s.results.filter((r=>{if(!Object.prototype.hasOwnProperty.call(r,"adTitle"))return r})));else for(let r in s){const e=s[r]?.results;e&&Array.isArray(e)&&(s[r].results=s[r].results.filter((r=>{if(!Object.prototype.hasOwnProperty.call(r,"adTitle"))return r})))}}catch(r){}return s}});})();': () => {
        try {
            window.JSON.parse = new Proxy(JSON.parse, {
                apply(r, e, t) {
                    const s = Reflect.apply(r, e, t), l = s?.results;
                    try {
                        if (l && Array.isArray(l)) s?.results && (s.results = s.results.filter((r => {
                            if (!Object.prototype.hasOwnProperty.call(r, "adTitle")) return r;
                        }))); else for (let r in s) {
                            const e = s[r]?.results;
                            e && Array.isArray(e) && (s[r].results = s[r].results.filter((r => {
                                if (!Object.prototype.hasOwnProperty.call(r, "adTitle")) return r;
                            })));
                        }
                    } catch (r) {}
                    return s;
                }
            });
        } catch (r) {
            console.error("Error executing AG js: " + r);
        }
    },
    '(()=>{const n=function(n){if("function"==typeof n)try{n.call()}catch(n){}},i={addAdUnits:function(){},adServers:{dfp:{buildVideoUrl:function(){return""}}},adUnits:[],aliasBidder:function(){},cmd:[],enableAnalytics:function(){},getHighestCpmBids:function(){return[]},libLoaded:!0,que:[],requestBids:function(n){if(n instanceof Object&&n.bidsBackHandler)try{n.bidsBackHandler.call()}catch(n){}},removeAdUnit:function(){},setBidderConfig:function(){},setConfig:function(){},setTargetingForGPTAsync:function(){},rp:{requestVideoBids:function(n){if("function"==typeof n?.callback)try{n.callback.call()}catch(n){}}}};i.cmd.push=n,i.que.push=n,window.pbjs=i})();': () => {
        try {
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
        } catch (n) {
            console.error("Error executing AG js: " + n);
        }
    },
    '(()=>{const c=function(){[...arguments].forEach((c=>{if("function"==typeof c)try{c(!0)}catch(c){console.debug(c)}}))},n=[];n.push=c,window.PQ={cmd:n,getTargeting:c}})();': () => {
        try {
            (() => {
                const c = function() {
                    [ ...arguments ].forEach((c => {
                        if ("function" == typeof c) try {
                            c(!0);
                        } catch (c) {
                            console.debug(c);
                        }
                    }));
                }, o = [];
                o.push = c, window.PQ = {
                    cmd: o,
                    getTargeting: c
                };
            })();
        } catch (c) {
            console.error("Error executing AG js: " + c);
        }
    },
    '(()=>{const n=function(n){if("function"==typeof n)try{n.call()}catch(n){}},i={addAdUnits:function(){},adServers:{dfp:{buildVideoUrl:function(){return""}}},adUnits:[],aliasBidder:function(){},cmd:[],enableAnalytics:function(){},getHighestCpmBids:function(){return[]},libLoaded:!0,que:[],requestBids:function(n){if(n instanceof Object&&n.bidsBackHandler)try{n.bidsBackHandler.call()}catch(n){}},removeAdUnit:function(){},setBidderConfig:function(){},setConfig:function(){},setTargetingForGPTAsync:function(){}};i.cmd.push=n,i.que.push=n,window.pbjs=i})();': () => {
        try {
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
                    setTargetingForGPTAsync: function() {}
                };
                t.cmd.push = n, t.que.push = n, window.pbjs = t;
            })();
        } catch (n) {
            console.error("Error executing AG js: " + n);
        }
    },
    '(()=>{const t=[];t.push=function(t){try{t()}catch(t){}};window.headertag={cmd:t,buildGamMvt:function(t,c){const n={[c]:"https://securepubads.g.doubleclick.net/gampad/ads"};return n||{}},retrieveVideoDemand:function(t,c,n){const e=t[0]?.htSlotName;if("function"==typeof c)try{c(e)}catch(t){}}}})();': () => {
        try {
            (() => {
                const t = [];
                t.push = function(t) {
                    try {
                        t();
                    } catch (t) {}
                };
                window.headertag = {
                    cmd: t,
                    buildGamMvt: function(t, c) {
                        return {
                            [c]: "https://securepubads.g.doubleclick.net/gampad/ads"
                        } || {};
                    },
                    retrieveVideoDemand: function(t, c, e) {
                        const n = t[0]?.htSlotName;
                        if ("function" == typeof c) try {
                            c(n);
                        } catch (t) {}
                    }
                };
            })();
        } catch (t) {
            console.error("Error executing AG js: " + t);
        }
    },
    '(()=>{const e="3.453.0",t=function(){},s={},n=function(e){const t=document.createElement("div");t.style.setProperty("display","none","important"),t.style.setProperty("visibility","collapse","important"),e&&e.appendChild(t)};n.prototype.destroy=t,n.prototype.initialize=t;const i=function(){};i.CompanionBackfillMode={ALWAYS:"always",ON_MASTER_AD:"on_master_ad"},i.VpaidMode={DISABLED:0,ENABLED:1,INSECURE:2},i.prototype={c:!0,f:{},i:!1,l:"",p:"",r:0,t:"",v:"",getCompanionBackfill:t,getDisableCustomPlaybackForIOS10Plus(){return this.i},getDisabledFlashAds:()=>!0,getFeatureFlags(){return this.f},getLocale(){return this.l},getNumRedirects(){return this.r},getPlayerType(){return this.t},getPlayerVersion(){return this.v},getPpid(){return this.p},getVpaidMode(){return this.C},isCookiesEnabled(){return this.c},isVpaidAdapter(){return this.M},setCompanionBackfill:t,setAutoPlayAdBreaks(e){this.K=e},setCookiesEnabled(e){this.c=!!e},setDisableCustomPlaybackForIOS10Plus(e){this.i=!!e},setDisableFlashAds:t,setFeatureFlags(e){this.f=!!e},setIsVpaidAdapter(e){this.M=e},setLocale(e){this.l=!!e},setNumRedirects(e){this.r=!!e},setPageCorrelator(e){this.R=e},setPlayerType(e){this.t=!!e},setPlayerVersion(e){this.v=!!e},setPpid(e){this.p=!!e},setVpaidMode(e){this.C=e},setSessionId:t,setStreamCorrelator:t,setVpaidAllowed:t,CompanionBackfillMode:{ALWAYS:"always",ON_MASTER_AD:"on_master_ad"},VpaidMode:{DISABLED:0,ENABLED:1,INSECURE:2}};const r=function(){this.listeners=new Map,this._dispatch=function(e){let t=this.listeners.get(e.type);t=t?t.values():[];for(const s of Array.from(t))try{s(e)}catch(e){console.trace(e)}},this.addEventListener=function(e,t,s,n){Array.isArray(e)||(e=[e]);for(let s=0;s<e.length;s+=1){const i=e[s];this.listeners.has(i)||this.listeners.set(i,new Map),this.listeners.get(i).set(t,t.bind(n||this))}},this.removeEventListener=function(e,t){Array.isArray(e)||(e=[e]);for(let s=0;s<e.length;s+=1){const n=e[s];this.listeners.get(n)?.delete(t)}}},o=new r;o.volume=1,o.collapse=t,o.configureAdsManager=t,o.destroy=t,o.discardAdBreak=t,o.expand=t,o.focus=t,o.getAdSkippableState=()=>!1,o.getCuePoints=()=>[0],o.getCurrentAd=()=>h,o.getCurrentAdCuePoints=()=>[],o.getRemainingTime=()=>0,o.getVolume=function(){return this.volume},o.init=t,o.isCustomClickTrackingUsed=()=>!1,o.isCustomPlaybackUsed=()=>!1,o.pause=t,o.requestNextAdBreak=t,o.resize=t,o.resume=t,o.setVolume=function(e){this.volume=e},o.skip=t,o.start=function(){for(const e of [T.Type.LOADED,T.Type.STARTED,T.Type.CONTENT_RESUME_REQUESTED,T.Type.AD_BUFFERING,T.Type.FIRST_QUARTILE,T.Type.MIDPOINT,T.Type.THIRD_QUARTILE,T.Type.COMPLETE,T.Type.ALL_ADS_COMPLETED])try{this._dispatch(new s.AdEvent(e))}catch(e){console.trace(e)}},o.stop=t,o.updateAdsRenderingSettings=t;const a=Object.create(o),d=function(e,t,s){this.type=e,this.adsRequest=t,this.userRequestContext=s};d.prototype={getAdsManager:()=>a,getUserRequestContext(){return this.userRequestContext?this.userRequestContext:{}}},d.Type={ADS_MANAGER_LOADED:"adsManagerLoaded"};const E=r;E.prototype.settings=new i,E.prototype.contentComplete=t,E.prototype.destroy=t,E.prototype.getSettings=function(){return this.settings},E.prototype.getVersion=()=>e,E.prototype.requestAds=function(e,t){requestAnimationFrame((()=>{const{ADS_MANAGER_LOADED:n}=d.Type,i=new s.AdsManagerLoadedEvent(n,e,t);this._dispatch(i)}));const n=new s.AdError("adPlayError",1205,1205,"The browser prevented playback initiated without user interaction.",e,t);requestAnimationFrame((()=>{this._dispatch(new s.AdErrorEvent(n))}))};const A=t,u=function(){};u.prototype={setAdWillAutoPlay:t,setAdWillPlayMuted:t,setContinuousPlayback:t};const l=function(){};l.prototype={getAdPosition:()=>1,getIsBumper:()=>!1,getMaxDuration:()=>-1,getPodIndex:()=>1,getTimeOffset:()=>0,getTotalAds:()=>1};const g=function(){};g.prototype.getAdIdRegistry=function(){return""},g.prototype.getAdIsValue=function(){return""};const p=function(){};p.prototype={pi:new l,getAdId:()=>"",getAdPodInfo(){return this.pi},getAdSystem:()=>"",getAdvertiserName:()=>"",getApiFramework:()=>null,getCompanionAds:()=>[],getContentType:()=>"",getCreativeAdId:()=>"",getDealId:()=>"",getDescription:()=>"",getDuration:()=>8.5,getHeight:()=>0,getMediaUrl:()=>null,getMinSuggestedDuration:()=>-2,getSkipTimeOffset:()=>-1,getSurveyUrl:()=>null,getTitle:()=>"",getTraffickingParametersString:()=>"",getUiElements:()=>[""],getUniversalAdIdRegistry:()=>"unknown",getUniversalAdIds:()=>[new g],getUniversalAdIdValue:()=>"unknown",getVastMediaBitrate:()=>0,getVastMediaHeight:()=>0,getVastMediaWidth:()=>0,getWidth:()=>0,getWrapperAdIds:()=>[""],getWrapperAdSystems:()=>[""],getWrapperCreativeIds:()=>[""],isLinear:()=>!0,isSkippable:()=>!0};const c=function(){};c.prototype={getAdSlotId:()=>"",getContent:()=>"",getContentType:()=>"",getHeight:()=>1,getWidth:()=>1};const C=function(e,t,s,n,i,r){this.errorCode=t,this.message=n,this.type=e,this.adsRequest=i,this.userRequestContext=r,this.getErrorCode=function(){return this.errorCode},this.getInnerError=function(){return null},this.getMessage=function(){return this.message},this.getType=function(){return this.type},this.getVastErrorCode=function(){return this.vastErrorCode},this.toString=function(){return`AdError ${this.errorCode}: ${this.message}`}};C.ErrorCode={},C.Type={};const h=(()=>{try{for(const e of Object.values(window.vidible._getContexts()))if(e.getPlayer()?.div?.innerHTML.includes("www.engadget.com"))return!0}catch(e){}return!1})()?void 0:new p,T=function(e){this.type=e};T.prototype={getAd:()=>h,getAdData:()=>{}},T.Type={AD_BREAK_READY:"adBreakReady",AD_BUFFERING:"adBuffering",AD_CAN_PLAY:"adCanPlay",AD_METADATA:"adMetadata",AD_PROGRESS:"adProgress",ALL_ADS_COMPLETED:"allAdsCompleted",CLICK:"click",COMPLETE:"complete",CONTENT_PAUSE_REQUESTED:"contentPauseRequested",CONTENT_RESUME_REQUESTED:"contentResumeRequested",DURATION_CHANGE:"durationChange",EXPANDED_CHANGED:"expandedChanged",FIRST_QUARTILE:"firstQuartile",IMPRESSION:"impression",INTERACTION:"interaction",LINEAR_CHANGE:"linearChange",LINEAR_CHANGED:"linearChanged",LOADED:"loaded",LOG:"log",MIDPOINT:"midpoint",PAUSED:"pause",RESUMED:"resume",SKIPPABLE_STATE_CHANGED:"skippableStateChanged",SKIPPED:"skip",STARTED:"start",THIRD_QUARTILE:"thirdQuartile",USER_CLOSE:"userClose",VIDEO_CLICKED:"videoClicked",VIDEO_ICON_CLICKED:"videoIconClicked",VIEWABLE_IMPRESSION:"viewable_impression",VOLUME_CHANGED:"volumeChange",VOLUME_MUTED:"mute"};const y=function(e){this.error=e,this.type="adError",this.getError=function(){return this.error},this.getUserRequestContext=function(){return this.error?.userRequestContext?this.error.userRequestContext:{}}};y.Type={AD_ERROR:"adError"};const I=function(){};I.Type={CUSTOM_CONTENT_LOADED:"deprecated-event"};const R=function(){};R.CreativeType={ALL:"All",FLASH:"Flash",IMAGE:"Image"},R.ResourceType={ALL:"All",HTML:"Html",IFRAME:"IFrame",STATIC:"Static"},R.SizeCriteria={IGNORE:"IgnoreSize",SELECT_EXACT_MATCH:"SelectExactMatch",SELECT_NEAR_MATCH:"SelectNearMatch"};const S=function(){};S.prototype={getCuePoints:()=>[],getAdIdRegistry:()=>"",getAdIdValue:()=>""};const D=t;Object.assign(s,{AdCuePoints:S,AdDisplayContainer:n,AdError:C,AdErrorEvent:y,AdEvent:T,AdPodInfo:l,AdProgressData:D,AdsLoader:E,AdsManager:a,AdsManagerLoadedEvent:d,AdsRenderingSettings:A,AdsRequest:u,CompanionAd:c,CompanionAdSelectionSettings:R,CustomContentLoadedEvent:I,gptProxyInstance:{},ImaSdkSettings:i,OmidAccessMode:{DOMAIN:"domain",FULL:"full",LIMITED:"limited"},OmidVerificationVendor:{1:"OTHER",2:"MOAT",3:"DOUBLEVERIFY",4:"INTEGRAL_AD_SCIENCE",5:"PIXELATE",6:"NIELSEN",7:"COMSCORE",8:"MEETRICS",9:"GOOGLE",OTHER:1,MOAT:2,DOUBLEVERIFY:3,INTEGRAL_AD_SCIENCE:4,PIXELATE:5,NIELSEN:6,COMSCORE:7,MEETRICS:8,GOOGLE:9},settings:new i,UiElements:{AD_ATTRIBUTION:"adAttribution",COUNTDOWN:"countdown"},UniversalAdIdInfo:g,VERSION:e,ViewMode:{FULLSCREEN:"fullscreen",NORMAL:"normal"}}),window.google||(window.google={}),window.google.ima?.dai&&(s.dai=window.google.ima.dai),window.google.ima=s})();': () => {
        try {
            (() => {
                const e = "3.453.0", t = function() {}, s = {}, n = function(e) {
                    const t = document.createElement("div");
                    t.style.setProperty("display", "none", "important"), t.style.setProperty("visibility", "collapse", "important"), 
                    e && e.appendChild(t);
                };
                n.prototype.destroy = t, n.prototype.initialize = t;
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
                const r = function() {
                    this.listeners = new Map, this._dispatch = function(e) {
                        let t = this.listeners.get(e.type);
                        t = t ? t.values() : [];
                        for (const s of Array.from(t)) try {
                            s(e);
                        } catch (e) {
                            console.trace(e);
                        }
                    }, this.addEventListener = function(e, t, s, n) {
                        Array.isArray(e) || (e = [ e ]);
                        for (let s = 0; s < e.length; s += 1) {
                            const i = e[s];
                            this.listeners.has(i) || this.listeners.set(i, new Map), this.listeners.get(i).set(t, t.bind(n || this));
                        }
                    }, this.removeEventListener = function(e, t) {
                        Array.isArray(e) || (e = [ e ]);
                        for (let s = 0; s < e.length; s += 1) {
                            const n = e[s];
                            this.listeners.get(n)?.delete(t);
                        }
                    };
                }, o = new r;
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
                        this._dispatch(new s.AdEvent(e));
                    } catch (e) {
                        console.trace(e);
                    }
                }, o.stop = t, o.updateAdsRenderingSettings = t;
                const a = Object.create(o), d = function(e, t, s) {
                    this.type = e, this.adsRequest = t, this.userRequestContext = s;
                };
                d.prototype = {
                    getAdsManager: () => a,
                    getUserRequestContext() {
                        return this.userRequestContext ? this.userRequestContext : {};
                    }
                }, d.Type = {
                    ADS_MANAGER_LOADED: "adsManagerLoaded"
                };
                const E = r;
                E.prototype.settings = new i, E.prototype.contentComplete = t, E.prototype.destroy = t, 
                E.prototype.getSettings = function() {
                    return this.settings;
                }, E.prototype.getVersion = () => e, E.prototype.requestAds = function(e, t) {
                    requestAnimationFrame((() => {
                        const {ADS_MANAGER_LOADED: n} = d.Type, i = new s.AdsManagerLoadedEvent(n, e, t);
                        this._dispatch(i);
                    }));
                    const n = new s.AdError("adPlayError", 1205, 1205, "The browser prevented playback initiated without user interaction.", e, t);
                    requestAnimationFrame((() => {
                        this._dispatch(new s.AdErrorEvent(n));
                    }));
                };
                const A = t, u = function() {};
                u.prototype = {
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
                const p = function() {};
                p.prototype = {
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
                const c = function() {};
                c.prototype = {
                    getAdSlotId: () => "",
                    getContent: () => "",
                    getContentType: () => "",
                    getHeight: () => 1,
                    getWidth: () => 1
                };
                const C = function(e, t, s, n, i, r) {
                    this.errorCode = t, this.message = n, this.type = e, this.adsRequest = i, this.userRequestContext = r, 
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
                })() ? void 0 : new p, T = function(e) {
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
                Object.assign(s, {
                    AdCuePoints: S,
                    AdDisplayContainer: n,
                    AdError: C,
                    AdErrorEvent: y,
                    AdEvent: T,
                    AdPodInfo: l,
                    AdProgressData: D,
                    AdsLoader: E,
                    AdsManager: a,
                    AdsManagerLoadedEvent: d,
                    AdsRenderingSettings: A,
                    AdsRequest: u,
                    CompanionAd: c,
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
                }), window.google || (window.google = {}), window.google.ima?.dai && (s.dai = window.google.ima.dai), 
                window.google.ima = s;
            })();
        } catch (e) {
            console.error("Error executing AG js: " + e);
        }
    },
    '(()=>{const t=[];t.push=function(t){"object"==typeof t&&t.events&&Object.values(t.events).forEach((t=>{if("function"==typeof t)try{t()}catch(t){}}))},window.AdBridg={cmd:t}})();': () => {
        try {
            (() => {
                const t = [];
                t.push = function(t) {
                    "object" == typeof t && t.events && Object.values(t.events).forEach((t => {
                        if ("function" == typeof t) try {
                            t();
                        } catch (t) {}
                    }));
                }, window.AdBridg = {
                    cmd: t
                };
            })();
        } catch (t) {
            console.error("Error executing AG js: " + t);
        }
    },
    '(()=>{let t=window?.__iasPET?.queue;Array.isArray(t)||(t=[]);const s=JSON.stringify({brandSafety:{},slots:{}});function e(t){try{t?.dataHandler?.(s)}catch(t){}}for(t.push=e,window.__iasPET={VERSION:"1.16.18",queue:t,sessionId:"",setTargetingForAppNexus(){},setTargetingForGPT(){},start(){}};t.length;)e(t.shift())})();': () => {
        try {
            (() => {
                let r = window?.__iasPET?.queue;
                Array.isArray(r) || (r = []);
                const t = JSON.stringify({
                    brandSafety: {},
                    slots: {}
                });
                function e(r) {
                    try {
                        r?.dataHandler?.(t);
                    } catch (r) {}
                }
                for (r.push = e, window.__iasPET = {
                    VERSION: "1.16.18",
                    queue: r,
                    sessionId: "",
                    setTargetingForAppNexus() {},
                    setTargetingForGPT() {},
                    start() {}
                }; r.length; ) e(r.shift());
            })();
        } catch (r) {
            console.error("Error executing AG js: " + r);
        }
    },
    '(()=>{const a=location.href;if(!a.includes("/download?link="))return;const b=new URL(a),c=b.searchParams.get("link");try{location.assign(`${location.protocol}//${c}`)}catch(a){}})();': () => {
        try {
            (() => {
                const o = location.href;
                if (!o.includes("/download?link=")) return;
                const c = new URL(o).searchParams.get("link");
                try {
                    location.assign(`${location.protocol}//${c}`);
                } catch (o) {}
            })();
        } catch (o) {
            console.error("Error executing AG js: " + o);
        }
    },
    '(()=>{window.XMLHttpRequest.prototype.open=new Proxy(window.XMLHttpRequest.prototype.open,{apply:async(a,b,c)=>{const d=c[1];if("string"!=typeof d||0===d.length)return Reflect.apply(a,b,c);const e=/topaz\\.dai\\.viacomcbs\\.digital\\/ondemand\\/hls\\/.*\\.m3u8/.test(d),f=/dai\\.google\\.com\\/ondemand\\/v.*\\/hls\\/content\\/.*\\/vid\\/.*\\/stream/.test(d);return(e||f)&&b.addEventListener("readystatechange",function(){if(4===b.readyState){const a=b.response;if(Object.defineProperty(b,"response",{writable:!0}),Object.defineProperty(b,"responseText",{writable:!0}),f&&(null!==a&&void 0!==a&&a.ad_breaks&&(a.ad_breaks=[]),null!==a&&void 0!==a&&a.apple_tv&&(a.apple_tv={})),e){const c=a.replaceAll(/#EXTINF:(\\d|\\d\\.\\d+)\\,\\nhttps:\\/\\/redirector\\.googlevideo\\.com\\/videoplayback\\?[\\s\\S]*?&source=dclk_video_ads&[\\s\\S]*?\\n/g,"");b.response=c,b.responseText=c}}}),Reflect.apply(a,b,c)}})})();': () => {
        try {
            window.XMLHttpRequest.prototype.open = new Proxy(window.XMLHttpRequest.prototype.open, {
                apply: async (e, t, o) => {
                    const n = o[1];
                    if ("string" != typeof n || 0 === n.length) return Reflect.apply(e, t, o);
                    const r = /topaz\.dai\.viacomcbs\.digital\/ondemand\/hls\/.*\.m3u8/.test(n), s = /dai\.google\.com\/ondemand\/v.*\/hls\/content\/.*\/vid\/.*\/stream/.test(n);
                    return (r || s) && t.addEventListener("readystatechange", (function() {
                        if (4 === t.readyState) {
                            const e = t.response;
                            if (Object.defineProperty(t, "response", {
                                writable: !0
                            }), Object.defineProperty(t, "responseText", {
                                writable: !0
                            }), s && (null != e && e.ad_breaks && (e.ad_breaks = []), null != e && e.apple_tv && (e.apple_tv = {})), 
                            r) {
                                const o = e.replaceAll(/#EXTINF:(\d|\d\.\d+)\,\nhttps:\/\/redirector\.googlevideo\.com\/videoplayback\?[\s\S]*?&source=dclk_video_ads&[\s\S]*?\n/g, "");
                                t.response = o, t.responseText = o;
                            }
                        }
                    })), Reflect.apply(e, t, o);
                }
            });
        } catch (e) {
            console.error("Error executing AG js: " + e);
        }
    },
    "(function(){window.twttr={conversion:{trackPid:function(){}}}})();": () => {
        try {
            window.twttr = {
                conversion: {
                    trackPid: function() {}
                }
            };
        } catch (r) {
            console.error("Error executing AG js: " + r);
        }
    },
    "(() => { var ReplaceMap = {adBreaks: [], adState: null, currentAdBreak: 'undefined'}; Object.defineProperty = new Proxy(Object.defineProperty, { apply: (target, thisArg, ArgsList) => { var Original = Reflect.apply(target, thisArg, ArgsList); if (ArgsList[1] == 'getAdBreaks' || ArgsList[1] == 'getAdsDisplayStringParams') { return Original[ArgsList[1]] = function() {}; } else if (ArgsList[1] == 'adBreaks' || ArgsList[1] == 'currentAdBreak' || typeof Original['adBreaks'] !== 'undefined') { for (var [key, value] of Object.entries(Original)) { if (typeof ReplaceMap[key] !== 'undefined' && ReplaceMap[key] !== 'undefined') { Original[key] = ReplaceMap[key]; } else if (typeof ReplaceMap[key] !== 'undefined' && ReplaceMap[key] === 'undefined') { Original[key] = undefined; } } return Original; } else { return Original; }}})})();": () => {
        try {
            (() => {
                var e = {
                    adBreaks: [],
                    adState: null,
                    currentAdBreak: "undefined"
                };
                Object.defineProperty = new Proxy(Object.defineProperty, {
                    apply: (r, n, t) => {
                        var a = Reflect.apply(r, n, t);
                        if ("getAdBreaks" == t[1] || "getAdsDisplayStringParams" == t[1]) return a[t[1]] = function() {};
                        if ("adBreaks" == t[1] || "currentAdBreak" == t[1] || void 0 !== a.adBreaks) {
                            for (var [d, i] of Object.entries(a)) void 0 !== e[d] && "undefined" !== e[d] ? a[d] = e[d] : void 0 !== e[d] && "undefined" === e[d] && (a[d] = void 0);
                            return a;
                        }
                        return a;
                    }
                });
            })();
        } catch (e) {
            console.error("Error executing AG js: " + e);
        }
    },
    '(()=>{const a=window.fetch,b={apply:async(b,c,d)=>{const e=d[0]instanceof Request?d[0].url:d[0];if("string"!=typeof e||0===e.length)return Reflect.apply(b,c,d);if(e.includes("uplynk.com/")&&e.includes(".m3u8")){const b=await a(...d);let c=await b.text();return c=c.replaceAll(/#UPLYNK-SEGMENT: \\S*\\,ad\\s[\\s\\S]+?((#UPLYNK-SEGMENT: \\S+\\,segment)|(#EXT-X-ENDLIST))/g,"$1"),new Response(c)}return Reflect.apply(b,c,d)}};try{window.fetch=new Proxy(window.fetch,b)}catch(a){}})();': () => {
        try {
            (() => {
                const e = window.fetch, t = {
                    apply: async (t, n, c) => {
                        const r = c[0] instanceof Request ? c[0].url : c[0];
                        if ("string" != typeof r || 0 === r.length) return Reflect.apply(t, n, c);
                        if (r.includes("uplynk.com/") && r.includes(".m3u8")) {
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
        } catch (e) {
            console.error("Error executing AG js: " + e);
        }
    },
    '(()=>{window.XMLHttpRequest.prototype.open=new Proxy(window.XMLHttpRequest.prototype.open,{apply:async(a,b,c)=>{const d=c[1];return"string"!=typeof d||0===d.length?Reflect.apply(a,b,c):(d.match(/pubads\\.g\\.doubleclick.net\\/ondemand\\/hls\\/.*\\.m3u8/)&&b.addEventListener("readystatechange",function(){if(4===b.readyState){const a=b.response;Object.defineProperty(b,"response",{writable:!0}),Object.defineProperty(b,"responseText",{writable:!0});const c=a.replaceAll(/#EXTINF:(\\d|\\d\\.\\d+)\\,\\nhttps:\\/\\/redirector\\.googlevideo\\.com\\/videoplayback\\?[\\s\\S]*?&source=dclk_video_ads&[\\s\\S]*?\\n/g,"");b.response=c,b.responseText=c}}),Reflect.apply(a,b,c))}})})();': () => {
        try {
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
        } catch (e) {
            console.error("Error executing AG js: " + e);
        }
    },
    '(()=>{const a=window.fetch;window.fetch=new Proxy(window.fetch,{apply:async(b,c,d)=>{const e=d[0];if("string"!=typeof e||0===e.length)return Reflect.apply(b,c,d);if(e.match(/pubads\\.g\\.doubleclick\\.net\\/ondemand\\/.*\\/content\\/.*\\/vid\\/.*\\/streams\\/.*\\/manifest\\.mpd|pubads\\.g\\.doubleclick.net\\/ondemand\\/hls\\/.*\\.m3u8/)){const b=await a(...d);let c=await b.text();return c=c.replaceAll(/<Period id="(pre|mid|post)-roll-.-ad-[\\s\\S]*?>[\\s\\S]*?<\\/Period>|#EXTINF:(\\d|\\d\\.\\d+)\\,\\nhttps:\\/\\/redirector\\.googlevideo\\.com\\/videoplayback\\?[\\s\\S]*?&source=dclk_video_ads&[\\s\\S]*?\\n/g,""),new Response(c)}return Reflect.apply(b,c,d)}})})();': () => {
        try {
            (() => {
                const e = window.fetch;
                window.fetch = new Proxy(window.fetch, {
                    apply: async (t, o, n) => {
                        const d = n[0];
                        if ("string" != typeof d || 0 === d.length) return Reflect.apply(t, o, n);
                        if (d.match(/pubads\.g\.doubleclick\.net\/ondemand\/.*\/content\/.*\/vid\/.*\/streams\/.*\/manifest\.mpd|pubads\.g\.doubleclick.net\/ondemand\/hls\/.*\.m3u8/)) {
                            const t = await e(...n);
                            let o = await t.text();
                            return o = o.replaceAll(/<Period id="(pre|mid|post)-roll-.-ad-[\s\S]*?>[\s\S]*?<\/Period>|#EXTINF:(\d|\d\.\d+)\,\nhttps:\/\/redirector\.googlevideo\.com\/videoplayback\?[\s\S]*?&source=dclk_video_ads&[\s\S]*?\n/g, ""), 
                            new Response(o);
                        }
                        return Reflect.apply(t, o, n);
                    }
                });
            })();
        } catch (e) {
            console.error("Error executing AG js: " + e);
        }
    },
    "(()=>{window.FAVE=window.FAVE||{};const s={set:(s,e,n,a)=>{if(s?.settings?.ads?.ssai?.prod?.clips?.enabled&&(s.settings.ads.ssai.prod.clips.enabled=!1),s?.player?.instances)for(var i of Object.keys(s.player.instances))s.player.instances[i]?.configs?.ads?.ssai?.prod?.clips?.enabled&&(s.player.instances[i].configs.ads.ssai.prod.clips.enabled=!1);return Reflect.set(s,e,n,a)}};window.FAVE=new Proxy(window.FAVE,s)})();": () => {
        try {
            (() => {
                window.FAVE = window.FAVE || {};
                const s = {
                    set: (s, e, n, a) => {
                        if (s?.settings?.ads?.ssai?.prod?.clips?.enabled && (s.settings.ads.ssai.prod.clips.enabled = !1), 
                        s?.player?.instances) for (var i of Object.keys(s.player.instances)) s.player.instances[i]?.configs?.ads?.ssai?.prod?.clips?.enabled && (s.player.instances[i].configs.ads.ssai.prod.clips.enabled = !1);
                        return Reflect.set(s, e, n, a);
                    }
                };
                window.FAVE = new Proxy(window.FAVE, s);
            })();
        } catch (s) {
            console.error("Error executing AG js: " + s);
        }
    },
    "(()=>{window.PostRelease={Start(){}}})();": () => {
        try {
            window.PostRelease = {
                Start() {}
            };
        } catch (r) {
            console.error("Error executing AG js: " + r);
        }
    },
    '(()=>{window.com_adswizz_synchro_decorateUrl=function(a){if("string"===typeof a&&a.startsWith("http"))return a}})();': () => {
        try {
            window.com_adswizz_synchro_decorateUrl = function(r) {
                if ("string" == typeof r && r.startsWith("http")) return r;
            };
        } catch (r) {
            console.error("Error executing AG js: " + r);
        }
    },
    '(()=>{window.XMLHttpRequest.prototype.open=new Proxy(window.XMLHttpRequest.prototype.open,{apply:async(a,b,c)=>{const d=c[1];return"string"!=typeof d||0===d.length?Reflect.apply(a,b,c):(d.match(/manifest\\..*\\.theplatform\\.com\\/.*\\/.*\\.m3u8\\?.*|manifest\\..*\\.theplatform\\.com\\/.*\\/*\\.meta.*/)&&b.addEventListener("readystatechange",function(){if(4===b.readyState){const a=b.response;Object.defineProperty(b,"response",{writable:!0}),Object.defineProperty(b,"responseText",{writable:!0});const c=a.replaceAll(/#EXTINF:.*\\n.*tvessaiprod\\.nbcuni\\.com\\/video\\/[\\s\\S]*?#EXT-X-DISCONTINUITY|#EXT-X-VMAP-AD-BREAK[\\s\\S]*?#EXT-X-ENDLIST/g,"");b.response=c,b.responseText=c}}),Reflect.apply(a,b,c))}})})();': () => {
        try {
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
        } catch (e) {
            console.error("Error executing AG js: " + e);
        }
    },
    '(()=>{let e,t=!1;const n=function(){},o=function(t,n){if("function"==typeof n)try{window.KalturaPlayer?n([]):e=n}catch(e){console.error(e)}};let r;Object.defineProperty(window,"PWT",{value:{requestBids:o,generateConfForGPT:o,addKeyValuePairsToGPTSlots:n,generateDFPURL:n}}),Object.defineProperty(window,"KalturaPlayer",{get:function(){return r},set:function(n){r=n,t||(t=!0,e([]))}})})();': () => {
        try {
            (() => {
                let e, t = !1;
                const r = function() {}, n = function(t, r) {
                    if ("function" == typeof r) try {
                        window.KalturaPlayer ? r([]) : e = r;
                    } catch (e) {
                        console.error(e);
                    }
                };
                let o;
                Object.defineProperty(window, "PWT", {
                    value: {
                        requestBids: n,
                        generateConfForGPT: n,
                        addKeyValuePairsToGPTSlots: r,
                        generateDFPURL: r
                    }
                }), Object.defineProperty(window, "KalturaPlayer", {
                    get: function() {
                        return o;
                    },
                    set: function(r) {
                        o = r, t || (t = !0, e([]));
                    }
                });
            })();
        } catch (e) {
            console.error("Error executing AG js: " + e);
        }
    },
    '(()=>{const a=function(){},b=function(c,a){if("function"==typeof a)try{a([])}catch(a){console.error(a)}};Object.defineProperty(window,"PWT",{value:{requestBids:b,generateConfForGPT:b,addKeyValuePairsToGPTSlots:a,generateDFPURL:a}})})();': () => {
        try {
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
        } catch (e) {
            console.error("Error executing AG js: " + e);
        }
    },
    "(function(){window.setTimeout=new Proxy(window.setTimeout,{apply:(a,b,c)=>c&&c[0]&&/if\\(!/.test(c[0].toString())&&c[1]&&1e4===c[1]?(c[1]*=.01,Reflect.apply(a,b,c)):Reflect.apply(a,b,c)});window.setInterval=new Proxy(window.setInterval,{apply:(a,b,c)=>c&&c[0]&&/initWait/.test(c[0].toString())&&c[1]&&1e3===c[1]?(c[1]*=.01,Reflect.apply(a,b,c)):Reflect.apply(a,b,c)})})();": () => {
        try {
            !function() {
                window.setTimeout = new Proxy(window.setTimeout, {
                    apply: (e, t, n) => n && n[0] && /if\(!/.test(n[0].toString()) && n[1] && 1e4 === n[1] ? (n[1] *= .01, 
                    Reflect.apply(e, t, n)) : Reflect.apply(e, t, n)
                });
                window.setInterval = new Proxy(window.setInterval, {
                    apply: (e, t, n) => n && n[0] && /initWait/.test(n[0].toString()) && n[1] && 1e3 === n[1] ? (n[1] *= .01, 
                    Reflect.apply(e, t, n)) : Reflect.apply(e, t, n)
                });
            }();
        } catch (e) {
            console.error("Error executing AG js: " + e);
        }
    },
    "(()=>{window.turner_getTransactionId=turner_getGuid=function(){},window.AdFuelUtils={getUMTOCookies(){}}})();": () => {
        try {
            window.turner_getTransactionId = turner_getGuid = function() {}, window.AdFuelUtils = {
                getUMTOCookies() {}
            };
        } catch (r) {
            console.error("Error executing AG js: " + r);
        }
    },
    '(function(){window.adsbygoogle={loaded:!0,push:function(a){if(null!==a&&a instanceof Object&&"Object"===a.constructor.name)for(let b in a)if("function"==typeof a[b])try{a[b].call()}catch(a){console.error(a)}}}})();': () => {
        try {
            window.adsbygoogle = {
                loaded: !0,
                push: function(o) {
                    if (null !== o && o instanceof Object && "Object" === o.constructor.name) for (let c in o) if ("function" == typeof o[c]) try {
                        o[c].call();
                    } catch (o) {
                        console.error(o);
                    }
                }
            };
        } catch (o) {
            console.error("Error executing AG js: " + o);
        }
    },
    "(()=>{document.addEventListener('DOMContentLoaded',()=>{setTimeout(function(){(function(){window.AdFuel={queueRegistry(){},destroySlots(){}}})()},500);})})();": () => {
        try {
            document.addEventListener("DOMContentLoaded", (() => {
                setTimeout((function() {
                    window.AdFuel = {
                        queueRegistry() {},
                        destroySlots() {}
                    };
                }), 500);
            }));
        } catch (e) {
            console.error("Error executing AG js: " + e);
        }
    },
    "(function(){var a={setConfig:function(){},aliasBidder:function(){},removeAdUnit:function(){},que:[push=function(){}]};window.pbjs=a})();": () => {
        try {
            !function() {
                var n = {
                    setConfig: function() {},
                    aliasBidder: function() {},
                    removeAdUnit: function() {},
                    que: [ push = function() {} ]
                };
                window.pbjs = n;
            }();
        } catch (n) {
            console.error("Error executing AG js: " + n);
        }
    },
    "window.addEventListener('DOMContentLoaded', function() { document.body.innerHTML = document.body.innerHTML.replace(/Adverts/g, \"\"); })": () => {
        try {
            window.addEventListener("DOMContentLoaded", (function() {
                document.body.innerHTML = document.body.innerHTML.replace(/Adverts/g, "");
            }));
        } catch (e) {
            console.error("Error executing AG js: " + e);
        }
    },
    "!function(){window.rTimer=function(){};window.jitaJS={rtk:{refreshAdUnits:function(){}}};}();": () => {
        try {
            !function() {
                window.rTimer = function() {};
                window.jitaJS = {
                    rtk: {
                        refreshAdUnits: function() {}
                    }
                };
            }();
        } catch (r) {
            console.error("Error executing AG js: " + r);
        }
    },
    '(()=>{const t=new MutationObserver((t=>{for(let e of t){const t=e.target;if(t?.querySelector?.("div:not([class], [id]):first-child + div:not([class], [id]):not([class], [id]):last-child")){const e=t.querySelector("div:not([class], [id]):last-child");if("#advertisement"===e?.shadowRoot?.querySelector?.("div:not([class], [id]) > div:not([class], [id])")?.textContent)try{e.remove()}catch(t){console.trace(t)}}}})),e={apply:(e,o,c)=>{try{c[0].mode="open"}catch(t){console.error(t)}const s=Reflect.apply(e,o,c);return t.observe(s,{subtree:!0,childList:!0}),s}};window.Element.prototype.attachShadow=new Proxy(window.Element.prototype.attachShadow,e)})();': () => {
        try {
            (() => {
                const t = new MutationObserver((t => {
                    for (let e of t) {
                        const o = e.target;
                        if (o?.querySelector?.("div:not([class], [id]):first-child + div:not([class], [id]):not([class], [id]):last-child")) {
                            const e = o.querySelector("div:not([class], [id]):last-child");
                            if ("#advertisement" === e?.shadowRoot?.querySelector?.("div:not([class], [id]) > div:not([class], [id])")?.textContent) try {
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
                        const c = Reflect.apply(e, o, r);
                        return t.observe(c, {
                            subtree: !0,
                            childList: !0
                        }), c;
                    }
                };
                window.Element.prototype.attachShadow = new Proxy(window.Element.prototype.attachShadow, e);
            })();
        } catch (t) {
            console.error("Error executing AG js: " + t);
        }
    },
    'document.cookie="vpn=1; path=/;";': () => {
        try {
            document.cookie = "vpn=1; path=/;";
        } catch (o) {
            console.error("Error executing AG js: " + o);
        }
    },
    "(()=>{document.addEventListener(\"DOMContentLoaded\",(()=>{ if(typeof jQuery) { jQuery('#SearchButtom').unbind('click'); } }));})();": () => {
        try {
            document.addEventListener("DOMContentLoaded", (() => {
                jQuery("#SearchButtom").unbind("click");
            }));
        } catch (e) {
            console.error("Error executing AG js: " + e);
        }
    },
    '(()=>{document.addEventListener("DOMContentLoaded",(()=>{ if(typeof videofunc) { videofunc(); } }));})();': () => {
        try {
            document.addEventListener("DOMContentLoaded", (() => {
                videofunc();
            }));
        } catch (e) {
            console.error("Error executing AG js: " + e);
        }
    },
    'document.cookie="p3006=1; path=/;";': () => {
        try {
            document.cookie = "p3006=1; path=/;";
        } catch (o) {
            console.error("Error executing AG js: " + o);
        }
    },
    'document.cookie="rpuShownDesktop=1; path=/;";': () => {
        try {
            document.cookie = "rpuShownDesktop=1; path=/;";
        } catch (o) {
            console.error("Error executing AG js: " + o);
        }
    },
    '(function(){var a;Object.defineProperty(window,"initLbjs",{get:function(){return a},set:function(c){a=function(a,b){b.AdPop=!1;return c(a,b)}}})})();': () => {
        try {
            !function() {
                var n;
                Object.defineProperty(window, "initLbjs", {
                    get: function() {
                        return n;
                    },
                    set: function(r) {
                        n = function(n, t) {
                            t.AdPop = !1;
                            return r(n, t);
                        };
                    }
                });
            }();
        } catch (n) {
            console.error("Error executing AG js: " + n);
        }
    },
    '(function(){var d=(new URL(window.location.href)).searchParams.get("cr");try{var a=atob(d)}catch(b){}try{new URL(a);var c=!0}catch(b){c=!1}if(c)try{window.location=a}catch(b){}})();': () => {
        try {
            !function() {
                var r = new URL(window.location.href).searchParams.get("cr");
                try {
                    var c = atob(r);
                } catch (r) {}
                try {
                    new URL(c);
                    var t = !0;
                } catch (r) {
                    t = !1;
                }
                if (t) try {
                    window.location = c;
                } catch (r) {}
            }();
        } catch (r) {
            console.error("Error executing AG js: " + r);
        }
    },
    '(function(){if(-1!=window.location.href.indexOf("/intro-mm"))for(var c=document.cookie.split(";"),b=0;b<c.length;b++){var a=c[b];a=a.split("=");"redirect_url_to_intro"==a[0]&&window.location.replace(decodeURIComponent(a[1]))}})();': () => {
        try {
            !function() {
                if (-1 != window.location.href.indexOf("/intro-mm")) for (var o = document.cookie.split(";"), r = 0; r < o.length; r++) {
                    var e = o[r];
                    "redirect_url_to_intro" == (e = e.split("="))[0] && window.location.replace(decodeURIComponent(e[1]));
                }
            }();
        } catch (o) {
            console.error("Error executing AG js: " + o);
        }
    },
    "(function(){var c=document.addEventListener;document.addEventListener=function(a,b,d,e){\"mousedown\"!=a&&-1==b.toString().indexOf(':!!')&&c(a,b,d,e)}.bind(document); var b=window.setTimeout;window.setTimeout=function(a,c){if(!/;if\\(\\!/.test(a.toString()))return b(a,c)};})();": () => {
        try {
            !function() {
                var t = document.addEventListener;
                document.addEventListener = function(n, e, o, i) {
                    "mousedown" != n && -1 == e.toString().indexOf(":!!") && t(n, e, o, i);
                }.bind(document);
                var n = window.setTimeout;
                window.setTimeout = function(t, e) {
                    if (!/;if\(\!/.test(t.toString())) return n(t, e);
                };
            }();
        } catch (t) {
            console.error("Error executing AG js: " + t);
        }
    },
    "(function(){var c=document.addEventListener;document.addEventListener=function(a,b,d,e){\"mousedown\"!=a&&-1==b.toString().indexOf('Z4P')&&c(a,b,d,e)}.bind(document); var b=window.setTimeout;window.setTimeout=function(a,c){if(!/\\..4P\\(|=setTimeout\\(/.test(a.toString()))return b(a,c)};})();": () => {
        try {
            !function() {
                var t = document.addEventListener;
                document.addEventListener = function(e, n, o, i) {
                    "mousedown" != e && -1 == n.toString().indexOf("Z4P") && t(e, n, o, i);
                }.bind(document);
                var e = window.setTimeout;
                window.setTimeout = function(t, n) {
                    if (!/\..4P\(|=setTimeout\(/.test(t.toString())) return e(t, n);
                };
            }();
        } catch (t) {
            console.error("Error executing AG js: " + t);
        }
    },
    "(function(){var c=document.addEventListener;document.addEventListener=function(a,b,d,e){\"click\"!=a&&-1==b.toString().indexOf('bi()')&&c(a,b,d,e)}.bind(document);})();": () => {
        try {
            !function() {
                var n = document.addEventListener;
                document.addEventListener = function(e, t, c, r) {
                    "click" != e && -1 == t.toString().indexOf("bi()") && n(e, t, c, r);
                }.bind(document);
            }();
        } catch (n) {
            console.error("Error executing AG js: " + n);
        }
    },
    "(function(){var c=document.addEventListener;document.addEventListener=function(a,b,d,e){\"mousedown\"!=a&&-1==b.toString().indexOf('Z4P')&&c(a,b,d,e)}.bind(document); var b=window.setTimeout;window.setTimeout=function(a,c){if(!/Z4P/.test(a.toString()))return b(a,c)};})();": () => {
        try {
            !function() {
                var t = document.addEventListener;
                document.addEventListener = function(n, e, o, i) {
                    "mousedown" != n && -1 == e.toString().indexOf("Z4P") && t(n, e, o, i);
                }.bind(document);
                var n = window.setTimeout;
                window.setTimeout = function(t, e) {
                    if (!/Z4P/.test(t.toString())) return n(t, e);
                };
            }();
        } catch (t) {
            console.error("Error executing AG js: " + t);
        }
    },
    "(function(){var c=document.addEventListener;document.addEventListener=function(a,b,d,e){\"click\"!=a&&-1==b.toString().indexOf('checkTarget')&&c(a,b,d,e)}.bind(document);})();": () => {
        try {
            !function() {
                var e = document.addEventListener;
                document.addEventListener = function(n, t, c, r) {
                    "click" != n && -1 == t.toString().indexOf("checkTarget") && e(n, t, c, r);
                }.bind(document);
            }();
        } catch (e) {
            console.error("Error executing AG js: " + e);
        }
    },
    '(function(){var c=document.addEventListener;document.addEventListener=function(a,b,d,e){"mouseup"!=a&&-1==b.toString().indexOf(`var U="click";var R=\'_blank\';var v="href";`)&&c(a,b,d,e)}.bind(document);})();': () => {
        try {
            !function() {
                var n = document.addEventListener;
                document.addEventListener = function(e, r, t, c) {
                    "mouseup" != e && -1 == r.toString().indexOf('var U="click";var R=\'_blank\';var v="href";') && n(e, r, t, c);
                }.bind(document);
            }();
        } catch (n) {
            console.error("Error executing AG js: " + n);
        }
    },
    "(function(){ var observer=new MutationObserver(hide);observer.observe(document,{childList:!0,subtree:!0});function hide(){var e=document.querySelectorAll('span[data-nosnippet] > .q-box');e.forEach(function(e){var i=e.innerText;if(i){if(i!==void 0&&(!0===i.includes('Sponsored')||!0===i.includes('Ad by')||!0===i.includes('Promoted by'))){e.style=\"display:none!important;\"}}})} })();": () => {
        try {
            new MutationObserver((function() {
                document.querySelectorAll("span[data-nosnippet] > .q-box").forEach((function(e) {
                    var n = e.innerText;
                    n && (void 0 === n || !0 !== n.includes("Sponsored") && !0 !== n.includes("Ad by") && !0 !== n.includes("Promoted by") || (e.style = "display:none!important;"));
                }));
            })).observe(document, {
                childList: !0,
                subtree: !0
            });
        } catch (e) {
            console.error("Error executing AG js: " + e);
        }
    },
    "(function(){ var observer=new MutationObserver(hide);observer.observe(document,{childList:!0,subtree:!0});function hide(){var e=document.querySelectorAll('.paged_list_wrapper > .pagedlist_item');e.forEach(function(e){var i=e.innerHTML;if(i){if(i!==void 0&&(!0===i.includes('Hide This Ad<\\/span>'))){e.style=\"display:none!important;\"}}})} })();": () => {
        try {
            new MutationObserver((function() {
                document.querySelectorAll(".paged_list_wrapper > .pagedlist_item").forEach((function(e) {
                    var r = e.innerHTML;
                    r && void 0 !== r && !0 === r.includes("Hide This Ad</span>") && (e.style = "display:none!important;");
                }));
            })).observe(document, {
                childList: !0,
                subtree: !0
            });
        } catch (e) {
            console.error("Error executing AG js: " + e);
        }
    },
    '!function(){new MutationObserver((function(){document.querySelectorAll("article > div[class] > div[class]").forEach((function(e){Object.keys(e).forEach((function(c){if(c.includes("__reactEvents")||c.includes("__reactProps")){c=e[c];try{c.children?.props?.adFragmentKey?.items&&e.parentNode.remove()}catch(c){}}}))}))})).observe(document,{childList:!0,subtree:!0});}();': () => {
        try {
            new MutationObserver((function() {
                document.querySelectorAll("article > div[class] > div[class]").forEach((function(e) {
                    Object.keys(e).forEach((function(r) {
                        if (r.includes("__reactEvents") || r.includes("__reactProps")) {
                            r = e[r];
                            try {
                                r.children?.props?.adFragmentKey?.items && e.parentNode.remove();
                            } catch (r) {}
                        }
                    }));
                }));
            })).observe(document, {
                childList: !0,
                subtree: !0
            });
        } catch (e) {
            console.error("Error executing AG js: " + e);
        }
    },
    '!function(){var e=0,r=[];new MutationObserver((function(){document.querySelectorAll("div[role=\'list\'] > div[role=\'listitem\']:not([style*=\'display: none\'])").forEach((function(i){Object.keys(i).forEach((function(s){if(s.includes("__reactFiber")||s.includes("__reactProps")){s=i[s];try{if(s.memoizedProps?.children?.props?.children?.props?.pin?.ad_destination_url||s.memoizedProps?.children?.props?.children?.props?.children?.props?.pin?.ad_destination_url||s.memoizedProps?.children?.props?.children?.props?.children?.props?.children?.props?.pin?.ad_destination_url){e++,i.style="display: none !important;";var n=i.querySelector(\'a[href] span[class*=" "]:last-child, a[href] div[class*=" "][style*="margin"]:last-child > div[class*=" "][style*="margin"] + div[class*=" "]:last-child\');n&&(r.push(["Ad blocked based on property ["+e+"] -> "+n.innerText]),console.table(r))}}catch(s){}}}))}))})).observe(document,{childList:!0,subtree:!0})}();': () => {
        try {
            !function() {
                var e = 0, r = [];
                new MutationObserver((function() {
                    document.querySelectorAll("div[role='list'] > div[role='listitem']:not([style*='display: none'])").forEach((function(i) {
                        Object.keys(i).forEach((function(s) {
                            if (s.includes("__reactFiber") || s.includes("__reactProps")) {
                                s = i[s];
                                try {
                                    if (s.memoizedProps?.children?.props?.children?.props?.pin?.ad_destination_url || s.memoizedProps?.children?.props?.children?.props?.children?.props?.pin?.ad_destination_url || s.memoizedProps?.children?.props?.children?.props?.children?.props?.children?.props?.pin?.ad_destination_url) {
                                        e++, i.style = "display: none !important;";
                                        var n = i.querySelector('a[href] span[class*=" "]:last-child, a[href] div[class*=" "][style*="margin"]:last-child > div[class*=" "][style*="margin"] + div[class*=" "]:last-child');
                                        n && (r.push([ "Ad blocked based on property [" + e + "] -> " + n.innerText ]), 
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
        } catch (e) {
            console.error("Error executing AG js: " + e);
        }
    },
    '!function(){var e=new MutationObserver(function(){var m=document.querySelectorAll("div[id^=\'mount_\']");{var e;e=0<m.length?document.querySelectorAll(\'div[role="feed"] > div[data-pagelet^="FeedUnit"] > div[class]:not([style*="height"])\'):document.querySelectorAll(\'[id^="substream"] > div:not(.hidden_elem) div[id^="hyperfeed_story_id"]\')}e.forEach(function(e){function n(e,n){for(0<m.length?"0"==(h=e.querySelectorAll(\'div[role="article"] span[dir="auto"] > a > span > span > span[data-content]\')).length&&(h=e.querySelectorAll(\'div[role="article"] span[dir="auto"] > a > span[aria-label]\')):h=e.querySelectorAll(".userContentWrapper h5 + div[data-testid] a [class] [class]"),socheck=0;socheck<h.length;socheck++)h[socheck].innerText.contains(n)&&(p=["1"],d=["1"],u=["1"],i=r=l=1,socheck=h.length)}function t(e,n,t,c,a){for(0<m.length?"0"==(h=e.querySelectorAll(\'div[role="article"] span[dir="auto"] > a > span > span > span[data-content]\')).length&&(h=e.querySelectorAll(\'div[role="article"] span[dir="auto"] div[role="button"][tabindex]\')):h=e.querySelectorAll(".userContentWrapper h5 + div[data-testid] > span a > [class] [class]"),"0"==h.length&&(h=e.querySelectorAll(\'div[role="article"] span[dir="auto"] > a > span[aria-label]\')),socheck=0;socheck<h.length;socheck++){spancheck=0,1<h.length?(spancheck=h[socheck].querySelectorAll("span")[0],0==spancheck&&(spancheck=h[socheck].querySelectorAll("b")[0])):(spancheck=h[0].querySelectorAll("span")[socheck],0==spancheck&&(spancheck=h[0].querySelectorAll("b")[socheck]));var o=h[0];if(0!=spancheck&&spancheck){if(2==spancheck.children.length&&0<m.length)for(spancheck=spancheck.querySelectorAll("span:not([style])"),spcheck=0;spcheck<spancheck.length;spcheck++)spancheck[spcheck].innerText.contains(n)?s=1:!spancheck[spcheck].innerText.contains(t)||0!=spancheck[spcheck].offsetTop||spancheck[spcheck].innerText.contains(n)||spancheck[spcheck].innerText.contains(c)||spancheck[spcheck].innerText.contains(a)?!spancheck[spcheck].innerText.contains(c)||0!=spancheck[spcheck].offsetTop||spancheck[spcheck].innerText.contains(t)||spancheck[spcheck].innerText.contains(n)||spancheck[spcheck].innerText.contains(a)?!spancheck[spcheck].innerText.contains(a)||0!=spancheck[spcheck].offsetTop||spancheck[spcheck].innerText.contains(t)||spancheck[spcheck].innerText.contains(c)||spancheck[spcheck].innerText.contains(n)||(u=["1"],i=1):(d=["1"],r=1):(p=["1"],l=1);0==m.length&&((!(spancheck.innerText.contains(n)&&0==spancheck.offsetTop||h[0].innerText.contains(n)&&0==h[0].offsetTop)||spancheck.innerText.contains(t)&&!h[0].innerText.contains(t)||spancheck.innerText.contains(c)&&!h[0].innerText.contains(c)||spancheck.innerText.contains(a)&&!h[0].innerText.contains(a))&&(!o.innerText.contains(n)||0!=o.offsetTop||o.innerText.contains(t)||o.innerText.contains(c)||o.innerText.contains(a))?!spancheck.innerText.contains(t)||0!=spancheck.offsetTop||spancheck.innerText.contains(n)||spancheck.innerText.contains(c)||spancheck.innerText.contains(a)?!spancheck.innerText.contains(c)||0!=spancheck.offsetTop||spancheck.innerText.contains(t)||spancheck.innerText.contains(n)||spancheck.innerText.contains(a)?!spancheck.innerText.contains(a)||0!=spancheck.offsetTop||spancheck.innerText.contains(t)||spancheck.innerText.contains(c)||spancheck.innerText.contains(n)||(u=["1"],i=1):(d=["1"],r=1):(p=["1"],l=1):s=1)}}}function c(e,n,t,c,a){u=0<m.length?(h=e.querySelectorAll(\'div[role="article"] span[dir="auto"] > a > span span[data-content=\'+n+"]"),p=e.querySelectorAll(\'div[role="article"] span[dir="auto"] > a > span span[data-content=\'+t+"]"),d=e.querySelectorAll(\'div[role="article"] span[dir="auto"] > a > span span[data-content=\'+c+"]"),e.querySelectorAll(\'div[role="article"] span[dir="auto"] > a > span span[data-content=\'+a+"]")):(h=e.querySelectorAll(".userContentWrapper h5 + div[data-testid] a [data-content="+n+"]"),p=e.querySelectorAll(".userContentWrapper h5 + div[data-testid] a [data-content="+t+"]"),d=e.querySelectorAll(".userContentWrapper h5 + div[data-testid] a [data-content="+c+"]"),e.querySelectorAll(".userContentWrapper h5 + div[data-testid] a [data-content="+a+"]"))}var s=0,l=0,r=0,i=0,h=0,p=0,d=0,u=0,a=e.querySelectorAll("div[style=\'width: 100%\'] > a[href*=\'oculus.com/quest\'] > div"),o=document.querySelector("[lang]"),k=document.querySelectorAll("link[rel=\'preload\'][href*=\'/l/\']");o=o?document.querySelector("[lang]").lang:"en";var y,g=e.querySelectorAll(\'a[ajaxify*="ad_id"] > span\'),f=e.querySelectorAll(\'a[href*="ads/about"]\'),S=e.querySelectorAll(\'a[href*="https://www.facebook.com/business/help"]\');if("display: none !important;"!=e.getAttribute("style")&&!e.classList.contains("hidden_elem")&&(0<g.length||0<f.length||0<S.length?(T+=1,0<m.length?(""==(y=e.querySelectorAll("a[href]")[0].innerText)&&(y=e.querySelectorAll("a[href]")[1].innerText),""==y&&(y=e.querySelectorAll("a[href]")[0].querySelectorAll("a[aria-label]")[0].getAttribute("aria-label"))):y=e.querySelectorAll("a[href]")[2].innerText,console.log("--------"),console.log("Ad hidden from: "+y),console.log("Total ads hidden: "+T),console.log("F length: "+g.length),console.log("H length: "+f.length),console.log("I length (Paid partnership): "+S.length),console.log("--------"),e.style="display:none!important;"):0<a.length?(T+=1,y="Facebook",console.log("--------"),console.log("Ad hidden from: "+y),console.log("Total ads hidden: "+T),console.log("Non-declared ad"),console.log("--------"),e.style="display:none!important;"):"af"==o?n(e,"Geborg"):"de"==o||"nl"==o?c(e,"G","e","s","n"):"am"==o?n(e,"የተከፈለበት ማስታወቂያ"):"ar"==o?n(e,"مُموَّل"):"as"==o?n(e,"পৃষ্ঠপোষকতা কৰা"):"az"==o?n(e,"Sponsor dəstəkli"):"co"==o?n(e,"Spunsurizatu"):"bs"==o||"sl"==o||"cs"==o?c(e,"S","p","z","n"):"da"==o||"en"==o||"et"==o||"fy"==o||"it"==o||"ku"==o||"nb"==o||"nn"==o||"pl"==o||"sq"==o||"sv"==o||"zz"==o?0<m.length?k[0].href.contains("en_UD")?n(e,"pəɹosuodS"):k[0].href.contains("ja_KS")?n(e,"広告"):k[0].href.contains("tz_MA")?n(e,"ⵉⴷⵍ"):k[0].href.contains("sy_SY")?n(e,"ܒܘܕܩܐ ܡܡܘܘܢܐ"):k[0].href.contains("cb_IQ")?n(e,"پاڵپشتیکراو"):k[0].href.contains("ar_AR")?n(e,"مُموَّل"):k[0].href.contains("sz_PL")?n(e,"Szpōnzorowane"):k[0].href.contains("eo_EO")?n(e,"Reklamo"):k[0].href.contains("es_LA")?c(e,"P","u","c","d"):(c(e,"S","p","s","n"),"0"==h.length&&t(e,"S","p","s","n"),"0"==h.length&&n(e,"Sponsored")):document.querySelector("body").className.includes("Locale_en_UD")?n(e,"pəɹosuodS"):document.querySelector("body").className.includes("ja_KS")?n(e,"広告"):document.querySelector("body").className.includes("tz_MA")?n(e,"ⵉⴷⵍ"):document.querySelector("body").className.includes("sy_SY")?n(e,"ܒܘܕܩܐ ܡܡܘܘܢܐ"):document.querySelector("body").className.includes("cb_IQ")?n(e,"پاڵپشتیکراو"):document.querySelector("body").className.includes("ar_AR")?n(e,"مُموَّل"):document.querySelector("body").className.includes("sz_PL")?n(e,"Szpōnzorowane"):document.querySelector("body").className.includes("eo_EO")?n(e,"Reklamo"):document.querySelector("body").className.includes("es_LA")?c(e,"P","u","c","d"):(c(e,"S","p","s","n"),"0"==h.length&&t(e,"S","p","s","n")):"be"==o?n(e,"Рэклама"):"bg"==o?n(e,"Спонсорирано"):"mk"==o?n(e,"Спонзорирано"):"br"==o?n(e,"Paeroniet"):"ca"==o?n(e,"Patrocinat"):"gl"==o||"pt"==o?(n(e,"Patrocinado"),"0"==l&&c(e,"P","a","c","o")):"bn"==o?n(e,"সৌজন্যে"):"cb"==o?n(e,"پاڵپشتیکراو"):"cx"==o?c(e,"G","i","s","n"):"cy"==o?n(e,"Noddwyd"):"el"==o?n(e,"Χορηγούμενη"):"eo"==o?n(e,"Reklamo"):"es"==o?c(e,"P","u","c","d"):"eu"==o?n(e,"Babestua"):"fa"==o?n(e,"دارای پشتیبانی مالی"):"ff"==o?n(e,"Yoɓanaama"):"fi"==o?n(e,"Sponsoroitu"):"fo"==o?n(e,"Stuðlað"):"fr"==o?0<m.length?k[0].href.contains("fr_FR")?c(e,"S","p","s","n"):c(e,"C","o","m","n"):document.querySelector("body").className.includes("Locale_fr_FR")?c(e,"S","p","s","n"):c(e,"C","o","m","n"):"ga"==o?n(e,"Urraithe"):"gn"==o?n(e,"Oñepatrosinapyre"):"gu"==o?n(e,"પ્રાયોજિત"):"ha"==o?n(e,"Daukar Nauyi"):"he"==o?n(e,"ממומן"):"hr"==o?n(e,"Plaćeni oglas"):"ht"==o?n(e,"Peye"):"ne"==o||"mr"==o||"hi"==o?n(e,"प्रायोजित"):"hu"==o?c(e,"H","i","r","d"):"hy"==o?n(e,"Գովազդային"):"id"==o?c(e,"B","e","p","n"):"is"==o?n(e,"Kostað"):"ja"==o?n(e,"広告"):"ms"==o?n(e,"Ditaja"):"jv"==o?n(e,"Disponsori"):"ka"==o?n(e,"რეკლამა"):"kk"==o?n(e,"Демеушілік көрсеткен"):"km"==o?n(e,"បានឧបត្ថម្ភ"):"kn"==o?n(e,"ಪ್ರಾಯೋಜಿತ"):"ko"==o?n(e,"Sponsored"):"ky"==o?n(e,"Демөөрчүлөнгөн"):"lo"==o?n(e,"ຜູ້ສະໜັບສະໜູນ"):"lt"==o?n(e,"Remiama"):"lv"==o?n(e,"Apmaksāta reklāma"):"mg"==o?n(e,"Misy Mpiantoka"):"ml"==o?n(e,"സ്പോൺസർ ചെയ്തത്"):"mn"==o?n(e,"Ивээн тэтгэсэн"):"mt"==o?n(e,"Sponsorjat"):"my"==o?(n(e,"ပံ့ပိုးထားသည်"),"0"==l&&n(e,"အခပေးကြော်ငြာ")):"or"==o?n(e,"ପ୍ରଯୋଜିତ"):"pa"==o?n(e,"ਸਰਪ੍ਰਸਤੀ ਪ੍ਰਾਪਤ"):"ps"==o?n(e,"تمويل شوي"):"ro"==o?n(e,"Sponsorizat"):"ru"==o||"uk"==o?n(e,"Реклама"):"rw"==o?n(e,"Icyamamaza ndasukirwaho"):"sc"==o?n(e,"Patronadu de"):"si"==o?n(e,"අනුග්රාහක"):"sk"==o?n(e,"Sponzorované"):"sn"==o?n(e,"Zvabhadharirwa"):"so"==o?n(e,"La maalgeliyey"):"sr"==o?n(e,"Спонзорисано"):"sw"==o?n(e,"Imedhaminiwa"):"sy"==o?n(e,"ܒܘܕܩܐ ܡܡܘܘܢܐ"):"sz"==o?n(e,"Szpōnzorowane"):"ta"==o?n(e,"விளம்பரம்"):"te"==o?n(e,"ప్రాయోజితం చేయబడింది"):"tg"==o?n(e,"Бо сарпарастӣ"):"th"==o?n(e,"ได้รับการสนับสนุน"):"tl"==o?n(e,"May Sponsor"):"tr"==o?n(e,"Sponsorlu"):"tt"==o?n(e,"Хәйрияче"):"tz"==o?n(e,"ⵉⴷⵍ"):"ur"==o?n(e,"سپانسرڈ"):"uz"==o?n(e,"Reklama"):"vi"==o?n(e,"Được tài trợ"):"zh-Hans"==o?n(e,"赞助内容"):"zh-Hant"==o&&n(e,"贊助"),0<h.length&&0<p.length&&0<d.length&&0<u.length)){for(cont=0;cont<h.length;cont++)0<h[cont].offsetHeight&&(cont=h.length,s=1);for(cont1=0;cont1<p.length;cont1++)0<p[cont1].offsetHeight&&(cont1=p.length,l=1);for(cont2=0;cont2<d.length;cont2++)0<d[cont2].offsetHeight&&(cont2=d.length,r=1);for(cont3=0;cont3<u.length;cont3++)0<u[cont3].offsetHeight&&(cont3=u.length,i=1);1==s&&1==l&&1==r&&1==i&&(0<m.length&&""!=(y=e.querySelectorAll("a[href]")[1].innerText)||(y=e.querySelectorAll("a[href]")[2].innerText),T+=1,console.log("--------"),console.log("Ad hidden from: "+y),console.log("Total ads hidden: "+T),console.log("--------"),e.style="display:none!important;")}})}),T=0;e.observe(document,{childList:!0,subtree:!0})}();': () => {
        try {
            !function() {
                var e = new MutationObserver((function() {
                    var e = document.querySelectorAll("div[id^='mount_']");
                    (0 < e.length ? document.querySelectorAll('div[role="feed"] > div[data-pagelet^="FeedUnit"] > div[class]:not([style*="height"])') : document.querySelectorAll('[id^="substream"] > div:not(.hidden_elem) div[id^="hyperfeed_story_id"]')).forEach((function(t) {
                        function c(n, t) {
                            for (0 < e.length ? "0" == (h = n.querySelectorAll('div[role="article"] span[dir="auto"] > a > span > span > span[data-content]')).length && (h = n.querySelectorAll('div[role="article"] span[dir="auto"] > a > span[aria-label]')) : h = n.querySelectorAll(".userContentWrapper h5 + div[data-testid] a [class] [class]"), 
                            socheck = 0; socheck < h.length; socheck++) h[socheck].innerText.contains(t) && (p = [ "1" ], 
                            d = [ "1" ], u = [ "1" ], i = r = l = 1, socheck = h.length);
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
                                    i = 1) : (d = [ "1" ], r = 1) : (p = [ "1" ], l = 1);
                                    0 == e.length && ((!(spancheck.innerText.contains(t) && 0 == spancheck.offsetTop || h[0].innerText.contains(t) && 0 == h[0].offsetTop) || spancheck.innerText.contains(c) && !h[0].innerText.contains(c) || spancheck.innerText.contains(o) && !h[0].innerText.contains(o) || spancheck.innerText.contains(a) && !h[0].innerText.contains(a)) && (!k.innerText.contains(t) || 0 != k.offsetTop || k.innerText.contains(c) || k.innerText.contains(o) || k.innerText.contains(a)) ? !spancheck.innerText.contains(c) || 0 != spancheck.offsetTop || spancheck.innerText.contains(t) || spancheck.innerText.contains(o) || spancheck.innerText.contains(a) ? !spancheck.innerText.contains(o) || 0 != spancheck.offsetTop || spancheck.innerText.contains(c) || spancheck.innerText.contains(t) || spancheck.innerText.contains(a) ? !spancheck.innerText.contains(a) || 0 != spancheck.offsetTop || spancheck.innerText.contains(c) || spancheck.innerText.contains(o) || spancheck.innerText.contains(t) || (u = [ "1" ], 
                                    i = 1) : (d = [ "1" ], r = 1) : (p = [ "1" ], l = 1) : s = 1);
                                }
                            }
                        }
                        function a(n, t, c, o, a) {
                            u = 0 < e.length ? (h = n.querySelectorAll('div[role="article"] span[dir="auto"] > a > span span[data-content=' + t + "]"), 
                            p = n.querySelectorAll('div[role="article"] span[dir="auto"] > a > span span[data-content=' + c + "]"), 
                            d = n.querySelectorAll('div[role="article"] span[dir="auto"] > a > span span[data-content=' + o + "]"), 
                            n.querySelectorAll('div[role="article"] span[dir="auto"] > a > span span[data-content=' + a + "]")) : (h = n.querySelectorAll(".userContentWrapper h5 + div[data-testid] a [data-content=" + t + "]"), 
                            p = n.querySelectorAll(".userContentWrapper h5 + div[data-testid] a [data-content=" + c + "]"), 
                            d = n.querySelectorAll(".userContentWrapper h5 + div[data-testid] a [data-content=" + o + "]"), 
                            n.querySelectorAll(".userContentWrapper h5 + div[data-testid] a [data-content=" + a + "]"));
                        }
                        var s = 0, l = 0, r = 0, i = 0, h = 0, p = 0, d = 0, u = 0, k = t.querySelectorAll("div[style='width: 100%'] > a[href*='oculus.com/quest'] > div"), y = document.querySelector("[lang]"), g = document.querySelectorAll("link[rel='preload'][href*='/l/']");
                        y = y ? document.querySelector("[lang]").lang : "en";
                        var f, S = t.querySelectorAll('a[ajaxify*="ad_id"] > span'), m = t.querySelectorAll('a[href*="ads/about"]'), T = t.querySelectorAll('a[href*="https://www.facebook.com/business/help"]');
                        if ("display: none !important;" != t.getAttribute("style") && !t.classList.contains("hidden_elem") && (0 < S.length || 0 < m.length || 0 < T.length ? (n += 1, 
                        0 < e.length ? ("" == (f = t.querySelectorAll("a[href]")[0].innerText) && (f = t.querySelectorAll("a[href]")[1].innerText), 
                        "" == f && (f = t.querySelectorAll("a[href]")[0].querySelectorAll("a[aria-label]")[0].getAttribute("aria-label"))) : f = t.querySelectorAll("a[href]")[2].innerText, 
                        console.log("--------"), console.log("Ad hidden from: " + f), console.log("Total ads hidden: " + n), 
                        console.log("F length: " + S.length), console.log("H length: " + m.length), console.log("I length (Paid partnership): " + T.length), 
                        console.log("--------"), t.style = "display:none!important;") : 0 < k.length ? (n += 1, 
                        f = "Facebook", console.log("--------"), console.log("Ad hidden from: " + f), console.log("Total ads hidden: " + n), 
                        console.log("Non-declared ad"), console.log("--------"), t.style = "display:none!important;") : "af" == y ? c(t, "Geborg") : "de" == y || "nl" == y ? a(t, "G", "e", "s", "n") : "am" == y ? c(t, "የተከፈለበት ማስታወቂያ") : "ar" == y ? c(t, "مُموَّل") : "as" == y ? c(t, "পৃষ্ঠপোষকতা কৰা") : "az" == y ? c(t, "Sponsor dəstəkli") : "co" == y ? c(t, "Spunsurizatu") : "bs" == y || "sl" == y || "cs" == y ? a(t, "S", "p", "z", "n") : "da" == y || "en" == y || "et" == y || "fy" == y || "it" == y || "ku" == y || "nb" == y || "nn" == y || "pl" == y || "sq" == y || "sv" == y || "zz" == y ? 0 < e.length ? g[0].href.contains("en_UD") ? c(t, "pəɹosuodS") : g[0].href.contains("ja_KS") ? c(t, "広告") : g[0].href.contains("tz_MA") ? c(t, "ⵉⴷⵍ") : g[0].href.contains("sy_SY") ? c(t, "ܒܘܕܩܐ ܡܡܘܘܢܐ") : g[0].href.contains("cb_IQ") ? c(t, "پاڵپشتیکراو") : g[0].href.contains("ar_AR") ? c(t, "مُموَّل") : g[0].href.contains("sz_PL") ? c(t, "Szpōnzorowane") : g[0].href.contains("eo_EO") ? c(t, "Reklamo") : g[0].href.contains("es_LA") ? a(t, "P", "u", "c", "d") : (a(t, "S", "p", "s", "n"), 
                        "0" == h.length && o(t, "S", "p", "s", "n"), "0" == h.length && c(t, "Sponsored")) : document.querySelector("body").className.includes("Locale_en_UD") ? c(t, "pəɹosuodS") : document.querySelector("body").className.includes("ja_KS") ? c(t, "広告") : document.querySelector("body").className.includes("tz_MA") ? c(t, "ⵉⴷⵍ") : document.querySelector("body").className.includes("sy_SY") ? c(t, "ܒܘܕܩܐ ܡܡܘܘܢܐ") : document.querySelector("body").className.includes("cb_IQ") ? c(t, "پاڵپشتیکراو") : document.querySelector("body").className.includes("ar_AR") ? c(t, "مُموَّل") : document.querySelector("body").className.includes("sz_PL") ? c(t, "Szpōnzorowane") : document.querySelector("body").className.includes("eo_EO") ? c(t, "Reklamo") : document.querySelector("body").className.includes("es_LA") ? a(t, "P", "u", "c", "d") : (a(t, "S", "p", "s", "n"), 
                        "0" == h.length && o(t, "S", "p", "s", "n")) : "be" == y ? c(t, "Рэклама") : "bg" == y ? c(t, "Спонсорирано") : "mk" == y ? c(t, "Спонзорирано") : "br" == y ? c(t, "Paeroniet") : "ca" == y ? c(t, "Patrocinat") : "gl" == y || "pt" == y ? (c(t, "Patrocinado"), 
                        "0" == l && a(t, "P", "a", "c", "o")) : "bn" == y ? c(t, "সৌজন্যে") : "cb" == y ? c(t, "پاڵپشتیکراو") : "cx" == y ? a(t, "G", "i", "s", "n") : "cy" == y ? c(t, "Noddwyd") : "el" == y ? c(t, "Χορηγούμενη") : "eo" == y ? c(t, "Reklamo") : "es" == y ? a(t, "P", "u", "c", "d") : "eu" == y ? c(t, "Babestua") : "fa" == y ? c(t, "دارای پشتیبانی مالی") : "ff" == y ? c(t, "Yoɓanaama") : "fi" == y ? c(t, "Sponsoroitu") : "fo" == y ? c(t, "Stuðlað") : "fr" == y ? 0 < e.length ? g[0].href.contains("fr_FR") ? a(t, "S", "p", "s", "n") : a(t, "C", "o", "m", "n") : document.querySelector("body").className.includes("Locale_fr_FR") ? a(t, "S", "p", "s", "n") : a(t, "C", "o", "m", "n") : "ga" == y ? c(t, "Urraithe") : "gn" == y ? c(t, "Oñepatrosinapyre") : "gu" == y ? c(t, "પ્રાયોજિત") : "ha" == y ? c(t, "Daukar Nauyi") : "he" == y ? c(t, "ממומן") : "hr" == y ? c(t, "Plaćeni oglas") : "ht" == y ? c(t, "Peye") : "ne" == y || "mr" == y || "hi" == y ? c(t, "प्रायोजित") : "hu" == y ? a(t, "H", "i", "r", "d") : "hy" == y ? c(t, "Գովազդային") : "id" == y ? a(t, "B", "e", "p", "n") : "is" == y ? c(t, "Kostað") : "ja" == y ? c(t, "広告") : "ms" == y ? c(t, "Ditaja") : "jv" == y ? c(t, "Disponsori") : "ka" == y ? c(t, "რეკლამა") : "kk" == y ? c(t, "Демеушілік көрсеткен") : "km" == y ? c(t, "បានឧបត្ថម្ភ") : "kn" == y ? c(t, "ಪ್ರಾಯೋಜಿತ") : "ko" == y ? c(t, "Sponsored") : "ky" == y ? c(t, "Демөөрчүлөнгөн") : "lo" == y ? c(t, "ຜູ້ສະໜັບສະໜູນ") : "lt" == y ? c(t, "Remiama") : "lv" == y ? c(t, "Apmaksāta reklāma") : "mg" == y ? c(t, "Misy Mpiantoka") : "ml" == y ? c(t, "സ്പോൺസർ ചെയ്തത്") : "mn" == y ? c(t, "Ивээн тэтгэсэн") : "mt" == y ? c(t, "Sponsorjat") : "my" == y ? (c(t, "ပံ့ပိုးထားသည်"), 
                        "0" == l && c(t, "အခပေးကြော်ငြာ")) : "or" == y ? c(t, "ପ୍ରଯୋଜିତ") : "pa" == y ? c(t, "ਸਰਪ੍ਰਸਤੀ ਪ੍ਰਾਪਤ") : "ps" == y ? c(t, "تمويل شوي") : "ro" == y ? c(t, "Sponsorizat") : "ru" == y || "uk" == y ? c(t, "Реклама") : "rw" == y ? c(t, "Icyamamaza ndasukirwaho") : "sc" == y ? c(t, "Patronadu de") : "si" == y ? c(t, "අනුග්රාහක") : "sk" == y ? c(t, "Sponzorované") : "sn" == y ? c(t, "Zvabhadharirwa") : "so" == y ? c(t, "La maalgeliyey") : "sr" == y ? c(t, "Спонзорисано") : "sw" == y ? c(t, "Imedhaminiwa") : "sy" == y ? c(t, "ܒܘܕܩܐ ܡܡܘܘܢܐ") : "sz" == y ? c(t, "Szpōnzorowane") : "ta" == y ? c(t, "விளம்பரம்") : "te" == y ? c(t, "ప్రాయోజితం చేయబడింది") : "tg" == y ? c(t, "Бо сарпарастӣ") : "th" == y ? c(t, "ได้รับการสนับสนุน") : "tl" == y ? c(t, "May Sponsor") : "tr" == y ? c(t, "Sponsorlu") : "tt" == y ? c(t, "Хәйрияче") : "tz" == y ? c(t, "ⵉⴷⵍ") : "ur" == y ? c(t, "سپانسرڈ") : "uz" == y ? c(t, "Reklama") : "vi" == y ? c(t, "Được tài trợ") : "zh-Hans" == y ? c(t, "赞助内容") : "zh-Hant" == y && c(t, "贊助"), 
                        0 < h.length && 0 < p.length && 0 < d.length && 0 < u.length)) {
                            for (cont = 0; cont < h.length; cont++) 0 < h[cont].offsetHeight && (cont = h.length, 
                            s = 1);
                            for (cont1 = 0; cont1 < p.length; cont1++) 0 < p[cont1].offsetHeight && (cont1 = p.length, 
                            l = 1);
                            for (cont2 = 0; cont2 < d.length; cont2++) 0 < d[cont2].offsetHeight && (cont2 = d.length, 
                            r = 1);
                            for (cont3 = 0; cont3 < u.length; cont3++) 0 < u[cont3].offsetHeight && (cont3 = u.length, 
                            i = 1);
                            1 == s && 1 == l && 1 == r && 1 == i && (0 < e.length && "" != (f = t.querySelectorAll("a[href]")[1].innerText) || (f = t.querySelectorAll("a[href]")[2].innerText), 
                            n += 1, console.log("--------"), console.log("Ad hidden from: " + f), console.log("Total ads hidden: " + n), 
                            console.log("--------"), t.style = "display:none!important;");
                        }
                    }));
                })), n = 0;
                e.observe(document, {
                    childList: !0,
                    subtree: !0
                });
            }();
        } catch (e) {
            console.error("Error executing AG js: " + e);
        }
    },
    '!function(){var b=0,d=[];new MutationObserver(function(){document.querySelectorAll("div[data-pagelet^=\\"FeedUnit\\"]:not([style*=\\"display: none\\"]), div[role=\\"feed\\"] > div:not([style*=\\"display: none\\"]), div[role=\\"feed\\"] > span:not([style*=\\"display: none\\"]), #ssrb_feed_start + div > div[class]:not([style*=\\"display: none\\"]), #ssrb_feed_start + div span > h3 ~ div[class]:not([style*=\\"display: none\\"]), #ssrb_feed_start + div h3~ div[class]:not([style*=\\"display: none\\"]), #ssrb_feed_start + div h3 ~ div > div[class]:not([style*=\\"display: none\\"]), div[role=\\"main\\"] div[class] > #ssrb_feed_start ~ div > h3 ~ div > div[class]:not([style*=\\"display: none\\"]), div[role=\\"main\\"] div > h3 ~ div > div[class]:not([style*=\\"display: none\\"]), #ssrb_feed_start + div > div > div[class]:not([style*=\\"display: none\\"]), div[role=\\"main\\"] div > h2 ~ div > div[class]:not([style*=\\"display: none\\"]), #ssrb_feed_start + div > div > div[class] > div:not([class], [id]) div:not([class], [id]):not([style*=\\"display: none\\"]), div[role=\\"main\\"] div > h3 ~ div > div[class] > div:not([class], [id]) div:not([class], [id], [dir], [data-0], [style]), div[role=\\"main\\"] div > h2 ~ div > div[class] > div > div:not([style*=\\"display: none\\"]), div[role=\\"main\\"] h3[dir=\\"auto\\"] + div > div[class]:not([style*=\\"display: none\\"]), div[role=\\"main\\"] div > h2 ~ div > div[class] > div > div:not([style*=\\"display: none\\"]) > div:not([style*=\\"display: none\\"]), div[role=\\"main\\"] div > h2 ~ div > div > div > div:not([style*=\\"display: none\\"]) > div:not([style*=\\"display: none\\"]), div[role=\\"main\\"] div > h3 ~ div > div > div > div:not([style*=\\"display: none\\"]) > div:not([style*=\\"display: none\\"])").forEach(function(e){Object.keys(e).forEach(function(a){if(a.includes?.("__reactEvents")||a.includes?.("__reactProps")){a=e[a];try{if(a.children?.props?.category?.includes("SPONSORED")||a.children?.props?.children?.props?.category?.includes("SPONSORED")||a.children?.props?.feedEdge?.category?.includes("SPONSORED")||a.children?.props?.children?.props?.feedEdge?.category?.includes("SPONSORED")||a.children?.props?.children?.props?.children?.props?.feedEdge?.category?.includes("SPONSORED")||a.children?.props?.children?.props?.children?.props?.children?.props?.feedEdge?.category?.includes("SPONSORED")||a.children?.props?.children?.props?.children?.props?.children?.props?.feedEdge?.feed_story_category?.includes("SPONSORED")||a.children?.props?.children?.props?.children?.props?.children?.props?.feedEdge?.story_category?.includes("SPONSORED")||a.children?.props?.children?.props?.children?.props?.children?.props?.feedEdge?.story_cat?.includes("SPONSORED")||a.children?.props?.children?.props?.children?.props?.children?.props?.feedEdge?.category_sensitive?.cat?.includes("SPONSORED")||a.children?.props?.children?.props?.children?.props?.children?.props?.feedEdge?.node?.sponsored_data?.brs_filter_setting||a.children?.props?.children?.props?.children?.props?.children?.props?.feedUnit?.lbl_sp_data?.ad_id||a.children?.props?.children?.props?.minGapType?.includes("SPONSORED")){b++,e.style="display: none !important;";var f=e.querySelector("a[href][aria-label]:not([aria-hidden])");f&&(d.push(["Ad blocked based on property ["+b+"] -> "+f.ariaLabel]),console.table(d))}}catch(a){}}})})}).observe(document,{childList:!0,subtree:!0})}();': () => {
        try {
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
        } catch (e) {
            console.error("Error executing AG js: " + e);
        }
    },
    '!function(){(new MutationObserver(function(){window.location.href.includes("/watch")&&document.querySelectorAll(\'#watch_feed div:not([class]):not([id]) > div[class*=" "]:not([style*="display: none !important"]) div[class^="_"] > div[class*=" "]\').forEach(function(b){Object.keys(b).forEach(function(a){if(a.includes("__reactFiber")){a=b[a];try{var c,d,e,f;if(null==(c=a)?0:null==(d=c["return"])?0:null==(e=d.memoizedProps)?0:null==(f=e.story)?0:f.sponsored_data){var g=b.closest(\'#watch_feed div[class*=" "] div:not([class]):not([id]) > div[class*=" "]:not([style*="display: none !important"])\');g.style="display: none !important;"}}catch(h){}}})})})).observe(document,{childList:!0,subtree:!0,attributeFilter:["style"]})}();': () => {
        try {
            new MutationObserver((function() {
                window.location.href.includes("/watch") && document.querySelectorAll('#watch_feed div:not([class]):not([id]) > div[class*=" "]:not([style*="display: none !important"]) div[class^="_"] > div[class*=" "]').forEach((function(t) {
                    Object.keys(t).forEach((function(e) {
                        if (e.includes("__reactFiber")) {
                            e = t[e];
                            try {
                                var n, s, o, l;
                                null != (n = e) && null != (s = n.return) && null != (o = s.memoizedProps) && null != (l = o.story) && l.sponsored_data && (t.closest('#watch_feed div[class*=" "] div:not([class]):not([id]) > div[class*=" "]:not([style*="display: none !important"])').style = "display: none !important;");
                            } catch (t) {}
                        }
                    }));
                }));
            })).observe(document, {
                childList: !0,
                subtree: !0,
                attributeFilter: [ "style" ]
            });
        } catch (t) {
            console.error("Error executing AG js: " + t);
        }
    },
    '!function(){if(location.href.includes("marketplace/item")){var b=0,d=[];new MutationObserver(function(){document.querySelectorAll("div[aria-label=\'Marketplace listing viewer\'] > div div + div + span:not([style*=\'display: none\']), #ssrb_feed_start + div > div div + div + span:not([style*=\'display: none\'])").forEach(function(e){Object.keys(e).forEach(function(a){if(a.includes("__reactEvents")||a.includes("__reactProps")){a=e[a];try{if(a.children?.props?.children?.props?.adId){b++,e.style="display: none !important;";var f=e.querySelector("a[href][aria-label]:not([aria-hidden])");f&&(d.push(["Ad blocked based on property ["+b+"] -> "+f.ariaLabel]),console.table(d))}}catch(a){}}})})}).observe(document,{childList:!0,subtree:!0})}}();': () => {
        try {
            !function() {
                if (location.href.includes("marketplace/item")) {
                    var e = 0, r = [];
                    new MutationObserver((function() {
                        document.querySelectorAll("div[aria-label='Marketplace listing viewer'] > div div + div + span:not([style*='display: none']), #ssrb_feed_start + div > div div + div + span:not([style*='display: none'])").forEach((function(i) {
                            Object.keys(i).forEach((function(t) {
                                if (t.includes("__reactEvents") || t.includes("__reactProps")) {
                                    t = i[t];
                                    try {
                                        if (t.children?.props?.children?.props?.adId) {
                                            e++, i.style = "display: none !important;";
                                            var n = i.querySelector("a[href][aria-label]:not([aria-hidden])");
                                            n && (r.push([ "Ad blocked based on property [" + e + "] -> " + n.ariaLabel ]), 
                                            console.table(r));
                                        }
                                    } catch (t) {}
                                }
                            }));
                        }));
                    })).observe(document, {
                        childList: !0,
                        subtree: !0
                    });
                }
            }();
        } catch (e) {
            console.error("Error executing AG js: " + e);
        }
    },
    '!function(){var e=new MutationObserver(function(){document.querySelectorAll(\'[id^="substream"] > div:not(.hidden_elem) div[id^="hyperfeed_story_id"]\').forEach(function(e){function t(e,t){for(s=e.querySelectorAll(\'.userContentWrapper h5 + div[data-testid*="sub"] a [class] [class]\'),socheck=0;socheck<s.length;socheck++)s[socheck].innerText.contains(t)&&(c=["1"],d=["1"],i=["1"],r=l=a=1,socheck=s.length)}function o(e,t,o,n,a){s=e.querySelectorAll(\'.userContentWrapper h5 + div[data-testid*="sub"] a [data-content=\'+t+"]"),c=e.querySelectorAll(\'.userContentWrapper h5 + div[data-testid*="sub"] a [data-content=\'+o+"]"),d=e.querySelectorAll(\'.userContentWrapper h5 + div[data-testid*="sub"] a [data-content=\'+n+"]"),i=e.querySelectorAll(\'.userContentWrapper h5 + div[data-testid*="sub"] a [data-content=\'+a+"]"),0==s.length&&(s=e.querySelectorAll(\'.userContentWrapper h5 + div[data-testid*="label"] a [data-content=\'+t+"]"),c=e.querySelectorAll(\'.userContentWrapper h5 + div[data-testid*="label"] a [data-content=\'+o+"]"),d=e.querySelectorAll(\'.userContentWrapper h5 + div[data-testid*="label"] a [data-content=\'+n+"]"),i=e.querySelectorAll(\'.userContentWrapper h5 + div[data-testid*="label"] a [data-content=\'+a+"]"))}var n=0,a=0,l=0,r=0,s=0,c=0,d=0,i=0,u=e.querySelectorAll("div[style=\'width: 100%\'] > a[href*=\'oculus.com/quest\'] > div"),h=document.querySelector("[lang]").lang,g=e.querySelectorAll(\'a[ajaxify*="ad_id"] > span\'),p=e.querySelectorAll(\'a[href*="ads/about"]\');if("display: none !important;"!=e.getAttribute("style")&&!e.classList.contains("hidden_elem")){if(0<g.length||0<p.length){f+=1;var y=e.querySelectorAll("a[href]")[2].innerText;console.log("--------"),console.log("Ad hidden from: "+y),console.log("Total ads hidden: "+f),console.log("F length: "+g.length),console.log("H length: "+p.length),console.log("--------"),e.style="display:none!important;"}else if(0<u.length){f+=1;y="Facebook";console.log("--------"),console.log("Ad hidden from: "+y),console.log("Total ads hidden: "+f),console.log("Non-declared ad"),console.log("--------"),e.style="display:none!important;"}else"af"==h?t(e,"Geborg"):"de"==h||"nl"==h?o(e,"G","e","s","n"):"am"==h?t(e,"የተከፈለበት ማስታወቂያ"):"ar"==h?t(e,"مُموَّل"):"as"==h?t(e,"পৃষ্ঠপোষকতা কৰা"):"az"==h?t(e,"Sponsor dəstəkli"):"co"==h?t(e,"Spunsurizatu"):"bs"==h||"sl"==h||"cs"==h?o(e,"S","p","z","n"):"da"==h||"en"==h||"et"==h||"fy"==h||"it"==h||"ku"==h||"nb"==h||"nn"==h||"pl"==h||"sq"==h||"sv"==h||"zz"==h?document.querySelector("body").className.includes("Locale_en_UD")?t(e,"pəɹosuodS"):o(e,"S","p","s","n"):"be"==h?t(e,"Рэклама"):"bg"==h?t(e,"Спонсорирано"):"mk"==h?t(e,"Спонзорирано"):"br"==h?t(e,"Paeroniet"):"ca"==h?t(e,"Patrocinat"):"gl"==h||"pt"==h?t(e,"Patrocinado"):"bn"==h?t(e,"সৌজন্যে"):"cb"==h?t(e,"پاڵپشتیکراو"):"cx"==h?o(e,"G","i","s","n"):"cy"==h?t(e,"Noddwyd"):"el"==h?t(e,"Χορηγούμενη"):"eo"==h?t(e,"Reklamo"):"es"==h?o(e,"P","u","c","d"):"eu"==h?t(e,"Babestua"):"fa"==h?t(e,"دارای پشتیبانی مالی"):"ff"==h?t(e,"Yoɓanaama"):"fi"==h?t(e,"Sponsoroitu"):"fo"==h?t(e,"Stuðlað"):"fr"==h?document.querySelector("body").className.includes("Locale_fr_FR")?o(e,"S","p","s","n"):o(e,"C","o","m","n"):"ga"==h?t(e,"Urraithe"):"gn"==h?t(e,"Oñepatrosinapyre"):"gu"==h?t(e,"પ્રાયોજિત"):"ha"==h?t(e,"Daukar Nauyi"):"he"==h?t(e,"ממומן"):"hr"==h?t(e,"Plaćeni oglas"):"ht"==h?t(e,"Peye"):"ne"==h||"mr"==h||"hi"==h?t(e,"प्रायोजित"):"hu"==h?o(e,"H","i","r","d"):"hy"==h?t(e,"Գովազդային"):"id"==h?o(e,"B","e","p","n"):"is"==h?t(e,"Kostað"):"ja"==h?t(e,"広告"):"ms"==h?t(e,"Ditaja"):"jv"==h?t(e,"Disponsori"):"ka"==h?t(e,"რეკლამა"):"kk"==h?t(e,"Демеушілік көрсеткен"):"km"==h?t(e,"បានឧបត្ថម្ភ"):"kn"==h?t(e,"ಪ್ರಾಯೋಜಿತ"):"ko"==h?t(e,"Sponsored"):"ky"==h?t(e,"Демөөрчүлөнгөн"):"lo"==h?t(e,"ຜູ້ສະໜັບສະໜູນ"):"lt"==h?t(e,"Remiama"):"lv"==h?t(e,"Apmaksāta reklāma"):"mg"==h?t(e,"Misy Mpiantoka"):"ml"==h?t(e,"സ്പോൺസർ ചെയ്തത്"):"mn"==h?t(e,"Ивээн тэтгэсэн"):"mt"==h?t(e,"Sponsorjat"):"my"==h?t(e,"ပံ့ပိုးထားသည်"):"or"==h?t(e,"ପ୍ରଯୋଜିତ"):"pa"==h?t(e,"ਸਰਪ੍ਰਸਤੀ ਪ੍ਰਾਪਤ"):"ps"==h?t(e,"تمويل شوي"):"ro"==h?t(e,"Sponsorizat"):"ru"==h||"uk"==h?t(e,"Реклама"):"rw"==h?t(e,"Icyamamaza ndasukirwaho"):"sc"==h?t(e,"Patronadu de"):"si"==h?t(e,"අනුග්‍රාහක"):"sk"==h?t(e,"Sponzorované"):"sn"==h?t(e,"Zvabhadharirwa"):"so"==h?t(e,"La maalgeliyey"):"sr"==h?t(e,"Спонзорисано"):"sw"==h?t(e,"Imedhaminiwa"):"sy"==h?t(e,"ܒܘܕܩܐ ܡܡܘܘܢܐ"):"sz"==h?t(e,"Szpōnzorowane"):"ta"==h?t(e,"விளம்பரம்"):"te"==h?t(e,"ప్రాయోజితం చేయబడింది"):"tg"==h?t(e,"Бо сарпарастӣ"):"th"==h?t(e,"ได้รับการสนับสนุน"):"tl"==h?t(e,"May Sponsor"):"tr"==h?t(e,"Sponsorlu"):"tt"==h?t(e,"Хәйрияче"):"tz"==h?t(e,"ⵉⴷⵍ"):"ur"==h?t(e,"سپانسرڈ"):"uz"==h?t(e,"Reklama"):"vi"==h?t(e,"Được tài trợ"):"zh-Hans"==h?t(e,"赞助内容"):"zh-Hant"==h&&t(e,"贊助");if(0<s.length&&0<c.length&&0<d.length&&0<i.length){for(cont=0;cont<s.length;cont++)0<s[cont].offsetHeight&&(cont=s.length,n=1);for(cont1=0;cont1<c.length;cont1++)0<c[cont1].offsetHeight&&(cont1=c.length,a=1);for(cont2=0;cont2<d.length;cont2++)0<d[cont2].offsetHeight&&(cont2=d.length,l=1);for(cont3=0;cont3<i.length;cont3++)0<i[cont3].offsetHeight&&(cont3=i.length,r=1);if(1==n&&1==a&&1==l&&1==r){y=e.querySelectorAll("a[href]")[2].innerText;f+=1,console.log("--------"),console.log("Ad hidden from: "+y),console.log("Total ads hidden: "+f),console.log("--------"),e.style="display:none!important;"}}}})}),f=0;e.observe(document,{childList:!0,subtree:!0,characterData:!0,attributes:!0})}();': () => {
        try {
            !function() {
                var e = new MutationObserver((function() {
                    document.querySelectorAll('[id^="substream"] > div:not(.hidden_elem) div[id^="hyperfeed_story_id"]').forEach((function(e) {
                        function o(e, t) {
                            for (c = e.querySelectorAll('.userContentWrapper h5 + div[data-testid*="sub"] a [class] [class]'), 
                            socheck = 0; socheck < c.length; socheck++) c[socheck].innerText.contains(t) && (i = [ "1" ], 
                            d = [ "1" ], u = [ "1" ], s = r = l = 1, socheck = c.length);
                        }
                        function n(e, t, o, n, a) {
                            c = e.querySelectorAll('.userContentWrapper h5 + div[data-testid*="sub"] a [data-content=' + t + "]"), 
                            i = e.querySelectorAll('.userContentWrapper h5 + div[data-testid*="sub"] a [data-content=' + o + "]"), 
                            d = e.querySelectorAll('.userContentWrapper h5 + div[data-testid*="sub"] a [data-content=' + n + "]"), 
                            u = e.querySelectorAll('.userContentWrapper h5 + div[data-testid*="sub"] a [data-content=' + a + "]"), 
                            0 == c.length && (c = e.querySelectorAll('.userContentWrapper h5 + div[data-testid*="label"] a [data-content=' + t + "]"), 
                            i = e.querySelectorAll('.userContentWrapper h5 + div[data-testid*="label"] a [data-content=' + o + "]"), 
                            d = e.querySelectorAll('.userContentWrapper h5 + div[data-testid*="label"] a [data-content=' + n + "]"), 
                            u = e.querySelectorAll('.userContentWrapper h5 + div[data-testid*="label"] a [data-content=' + a + "]"));
                        }
                        var a = 0, l = 0, r = 0, s = 0, c = 0, i = 0, d = 0, u = 0, h = e.querySelectorAll("div[style='width: 100%'] > a[href*='oculus.com/quest'] > div"), g = document.querySelector("[lang]").lang, p = e.querySelectorAll('a[ajaxify*="ad_id"] > span'), y = e.querySelectorAll('a[href*="ads/about"]');
                        if ("display: none !important;" != e.getAttribute("style") && !e.classList.contains("hidden_elem")) {
                            if (0 < p.length || 0 < y.length) {
                                t += 1;
                                var f = e.querySelectorAll("a[href]")[2].innerText;
                                console.log("--------"), console.log("Ad hidden from: " + f), console.log("Total ads hidden: " + t), 
                                console.log("F length: " + p.length), console.log("H length: " + y.length), console.log("--------"), 
                                e.style = "display:none!important;";
                            } else if (0 < h.length) {
                                t += 1;
                                f = "Facebook";
                                console.log("--------"), console.log("Ad hidden from: " + f), console.log("Total ads hidden: " + t), 
                                console.log("Non-declared ad"), console.log("--------"), e.style = "display:none!important;";
                            } else "af" == g ? o(e, "Geborg") : "de" == g || "nl" == g ? n(e, "G", "e", "s", "n") : "am" == g ? o(e, "የተከፈለበት ማስታወቂያ") : "ar" == g ? o(e, "مُموَّل") : "as" == g ? o(e, "পৃষ্ঠপোষকতা কৰা") : "az" == g ? o(e, "Sponsor dəstəkli") : "co" == g ? o(e, "Spunsurizatu") : "bs" == g || "sl" == g || "cs" == g ? n(e, "S", "p", "z", "n") : "da" == g || "en" == g || "et" == g || "fy" == g || "it" == g || "ku" == g || "nb" == g || "nn" == g || "pl" == g || "sq" == g || "sv" == g || "zz" == g ? document.querySelector("body").className.includes("Locale_en_UD") ? o(e, "pəɹosuodS") : n(e, "S", "p", "s", "n") : "be" == g ? o(e, "Рэклама") : "bg" == g ? o(e, "Спонсорирано") : "mk" == g ? o(e, "Спонзорирано") : "br" == g ? o(e, "Paeroniet") : "ca" == g ? o(e, "Patrocinat") : "gl" == g || "pt" == g ? o(e, "Patrocinado") : "bn" == g ? o(e, "সৌজন্যে") : "cb" == g ? o(e, "پاڵپشتیکراو") : "cx" == g ? n(e, "G", "i", "s", "n") : "cy" == g ? o(e, "Noddwyd") : "el" == g ? o(e, "Χορηγούμενη") : "eo" == g ? o(e, "Reklamo") : "es" == g ? n(e, "P", "u", "c", "d") : "eu" == g ? o(e, "Babestua") : "fa" == g ? o(e, "دارای پشتیبانی مالی") : "ff" == g ? o(e, "Yoɓanaama") : "fi" == g ? o(e, "Sponsoroitu") : "fo" == g ? o(e, "Stuðlað") : "fr" == g ? document.querySelector("body").className.includes("Locale_fr_FR") ? n(e, "S", "p", "s", "n") : n(e, "C", "o", "m", "n") : "ga" == g ? o(e, "Urraithe") : "gn" == g ? o(e, "Oñepatrosinapyre") : "gu" == g ? o(e, "પ્રાયોજિત") : "ha" == g ? o(e, "Daukar Nauyi") : "he" == g ? o(e, "ממומן") : "hr" == g ? o(e, "Plaćeni oglas") : "ht" == g ? o(e, "Peye") : "ne" == g || "mr" == g || "hi" == g ? o(e, "प्रायोजित") : "hu" == g ? n(e, "H", "i", "r", "d") : "hy" == g ? o(e, "Գովազդային") : "id" == g ? n(e, "B", "e", "p", "n") : "is" == g ? o(e, "Kostað") : "ja" == g ? o(e, "広告") : "ms" == g ? o(e, "Ditaja") : "jv" == g ? o(e, "Disponsori") : "ka" == g ? o(e, "რეკლამა") : "kk" == g ? o(e, "Демеушілік көрсеткен") : "km" == g ? o(e, "បានឧបត្ថម្ភ") : "kn" == g ? o(e, "ಪ್ರಾಯೋಜಿತ") : "ko" == g ? o(e, "Sponsored") : "ky" == g ? o(e, "Демөөрчүлөнгөн") : "lo" == g ? o(e, "ຜູ້ສະໜັບສະໜູນ") : "lt" == g ? o(e, "Remiama") : "lv" == g ? o(e, "Apmaksāta reklāma") : "mg" == g ? o(e, "Misy Mpiantoka") : "ml" == g ? o(e, "സ്പോൺസർ ചെയ്തത്") : "mn" == g ? o(e, "Ивээн тэтгэсэн") : "mt" == g ? o(e, "Sponsorjat") : "my" == g ? o(e, "ပံ့ပိုးထားသည်") : "or" == g ? o(e, "ପ୍ରଯୋଜିତ") : "pa" == g ? o(e, "ਸਰਪ੍ਰਸਤੀ ਪ੍ਰਾਪਤ") : "ps" == g ? o(e, "تمويل شوي") : "ro" == g ? o(e, "Sponsorizat") : "ru" == g || "uk" == g ? o(e, "Реклама") : "rw" == g ? o(e, "Icyamamaza ndasukirwaho") : "sc" == g ? o(e, "Patronadu de") : "si" == g ? o(e, "අනුග්‍රාහක") : "sk" == g ? o(e, "Sponzorované") : "sn" == g ? o(e, "Zvabhadharirwa") : "so" == g ? o(e, "La maalgeliyey") : "sr" == g ? o(e, "Спонзорисано") : "sw" == g ? o(e, "Imedhaminiwa") : "sy" == g ? o(e, "ܒܘܕܩܐ ܡܡܘܘܢܐ") : "sz" == g ? o(e, "Szpōnzorowane") : "ta" == g ? o(e, "விளம்பரம்") : "te" == g ? o(e, "ప్రాయోజితం చేయబడింది") : "tg" == g ? o(e, "Бо сарпарастӣ") : "th" == g ? o(e, "ได้รับการสนับสนุน") : "tl" == g ? o(e, "May Sponsor") : "tr" == g ? o(e, "Sponsorlu") : "tt" == g ? o(e, "Хәйрияче") : "tz" == g ? o(e, "ⵉⴷⵍ") : "ur" == g ? o(e, "سپانسرڈ") : "uz" == g ? o(e, "Reklama") : "vi" == g ? o(e, "Được tài trợ") : "zh-Hans" == g ? o(e, "赞助内容") : "zh-Hant" == g && o(e, "贊助");
                            if (0 < c.length && 0 < i.length && 0 < d.length && 0 < u.length) {
                                for (cont = 0; cont < c.length; cont++) 0 < c[cont].offsetHeight && (cont = c.length, 
                                a = 1);
                                for (cont1 = 0; cont1 < i.length; cont1++) 0 < i[cont1].offsetHeight && (cont1 = i.length, 
                                l = 1);
                                for (cont2 = 0; cont2 < d.length; cont2++) 0 < d[cont2].offsetHeight && (cont2 = d.length, 
                                r = 1);
                                for (cont3 = 0; cont3 < u.length; cont3++) 0 < u[cont3].offsetHeight && (cont3 = u.length, 
                                s = 1);
                                if (1 == a && 1 == l && 1 == r && 1 == s) {
                                    f = e.querySelectorAll("a[href]")[2].innerText;
                                    t += 1, console.log("--------"), console.log("Ad hidden from: " + f), console.log("Total ads hidden: " + t), 
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
        } catch (e) {
            console.error("Error executing AG js: " + e);
        }
    },
    '!function(){var e,o;0<window.location.href.indexOf("marketplace")&&(e=new MutationObserver(function(){document.querySelectorAll(\'div[role="main"] div[class][style^="max-width:"] div[class][style^="max-width:"]\').forEach(function(e){var l,t=e.querySelectorAll(\'a[href*="ads/about"]\');"display: none !important;"==e.getAttribute("style")||e.classList.contains("hidden_elem")||0<t.length&&(o+=1,""==(l=e.querySelectorAll("a[href]")[0].innerText)&&(l=e.querySelectorAll("a[href]")[1].innerText),""==l&&(l=e.querySelectorAll("a[href]")[0].querySelectorAll("a[aria-label]")[0]?.getAttribute("aria-label")),console.log("--------"),console.log("Ad hidden from: "+l),console.log("Total ads hidden: "+o),console.log("H length: "+t.length),console.log("--------"),e.style="display:none!important;")})}),o=0,e.observe(document,{childList:!0,subtree:!0}))}();': () => {
        try {
            !function() {
                var e, l;
                0 < window.location.href.indexOf("marketplace") && (e = new MutationObserver((function() {
                    document.querySelectorAll('div[role="main"] div[class][style^="max-width:"] div[class][style^="max-width:"]').forEach((function(e) {
                        var t, o = e.querySelectorAll('a[href*="ads/about"]');
                        "display: none !important;" == e.getAttribute("style") || e.classList.contains("hidden_elem") || 0 < o.length && (l += 1, 
                        "" == (t = e.querySelectorAll("a[href]")[0].innerText) && (t = e.querySelectorAll("a[href]")[1].innerText), 
                        "" == t && (t = e.querySelectorAll("a[href]")[0].querySelectorAll("a[aria-label]")[0]?.getAttribute("aria-label")), 
                        console.log("--------"), console.log("Ad hidden from: " + t), console.log("Total ads hidden: " + l), 
                        console.log("H length: " + o.length), console.log("--------"), e.style = "display:none!important;");
                    }));
                })), l = 0, e.observe(document, {
                    childList: !0,
                    subtree: !0
                }));
            }();
        } catch (e) {
            console.error("Error executing AG js: " + e);
        }
    },
    '!function(){new MutationObserver(function(){document.querySelectorAll("div[role=\\"main\\"] div[class][style^=\\"max-width:\\"] div[class][style*=\\"max-width:\\"]:not([style*=\\"display: none\\"])").forEach(function(c){Object.keys(c).forEach(function(a){if(a.includes("__reactEvents")||a.includes("__reactProps")){a=c[a];try{a.children?.props?.adSurface?.startsWith("Marketplace")&&(c.style="display: none !important;")}catch(a){}}})})}).observe(document,{childList:!0,subtree:!0})}();': () => {
        try {
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
        } catch (e) {
            console.error("Error executing AG js: " + e);
        }
    },
    '!function(){if(window.location.href.includes("/marketplace/")){new MutationObserver(function(){document.querySelectorAll(\'div[data-testid="marketplace_home_feed"] div[class][data-testid^="MarketplaceUpsell-"] > div > div\').forEach(function(e){var t=e.outerHTML;t&&void 0!==t&&!0===t.includes("/ads/about/")&&(e.style="display:none!important;")})}).observe(document,{childList:!0,subtree:!0})}}();': () => {
        try {
            window.location.href.includes("/marketplace/") && new MutationObserver((function() {
                document.querySelectorAll('div[data-testid="marketplace_home_feed"] div[class][data-testid^="MarketplaceUpsell-"] > div > div').forEach((function(e) {
                    var t = e.outerHTML;
                    t && void 0 !== t && !0 === t.includes("/ads/about/") && (e.style = "display:none!important;");
                }));
            })).observe(document, {
                childList: !0,
                subtree: !0
            });
        } catch (e) {
            console.error("Error executing AG js: " + e);
        }
    },
    "(function(){var c=document.addEventListener;document.addEventListener=function(a,b,d,e){\"click\"!=a&&-1==b.toString().indexOf('about:blank')&&c(a,b,d,e)}.bind(document);})();": () => {
        try {
            !function() {
                var n = document.addEventListener;
                document.addEventListener = function(t, e, c, o) {
                    "click" != t && -1 == e.toString().indexOf("about:blank") && n(t, e, c, o);
                }.bind(document);
            }();
        } catch (n) {
            console.error("Error executing AG js: " + n);
        }
    },
    "(function(){var b=window.setTimeout;window.setTimeout=function(a,c){if(!/Object\\[/.test(a.toString()))return b(a,c)};})();": () => {
        try {
            !function() {
                var t = window.setTimeout;
                window.setTimeout = function(e, o) {
                    if (!/Object\[/.test(e.toString())) return t(e, o);
                };
            }();
        } catch (t) {
            console.error("Error executing AG js: " + t);
        }
    },
    '(function(){Object.defineProperty(window,"open",{writable:!1,enumerable:!1,configurable:!1,value:window.open})})();': () => {
        try {
            Object.defineProperty(window, "open", {
                writable: !1,
                enumerable: !1,
                configurable: !1,
                value: window.open
            });
        } catch (e) {
            console.error("Error executing AG js: " + e);
        }
    },
    "Object.defineProperty(window, 'sas_manager', { get: function() { return { noad: function() {} }; }, set: function() {} });": () => {
        try {
            Object.defineProperty(window, "sas_manager", {
                get: function() {
                    return {
                        noad: function() {}
                    };
                },
                set: function() {}
            });
        } catch (n) {
            console.error("Error executing AG js: " + n);
        }
    },
    "(function(){var b=window.setTimeout;window.setTimeout=function(a,c){if(!/=setTimeout\\(/.test(a.toString()))return b(a,c)};})();": () => {
        try {
            !function() {
                var t = window.setTimeout;
                window.setTimeout = function(e, o) {
                    if (!/=setTimeout\(/.test(e.toString())) return t(e, o);
                };
            }();
        } catch (t) {
            console.error("Error executing AG js: " + t);
        }
    },
    "(function(){var c=document.addEventListener;document.addEventListener=function(a,b,d,e){\"click\"!=a&&-1==b.toString().indexOf('.hi()')&&c(a,b,d,e)}.bind(document);})();": () => {
        try {
            !function() {
                var n = document.addEventListener;
                document.addEventListener = function(e, t, c, r) {
                    "click" != e && -1 == t.toString().indexOf(".hi()") && n(e, t, c, r);
                }.bind(document);
            }();
        } catch (n) {
            console.error("Error executing AG js: " + n);
        }
    },
    '(function(){var c=document.addEventListener;document.addEventListener=function(a,b,d,e){"click"!=a&&-1==b.toString().indexOf(\'"dtnoppu"\')&&c(a,b,d,e)}.bind(document);})();': () => {
        try {
            !function() {
                var n = document.addEventListener;
                document.addEventListener = function(t, e, c, o) {
                    "click" != t && -1 == e.toString().indexOf('"dtnoppu"') && n(t, e, c, o);
                }.bind(document);
            }();
        } catch (n) {
            console.error("Error executing AG js: " + n);
        }
    },
    'window["pop_clicked"] = 1;': () => {
        try {
            window.pop_clicked = 1;
        } catch (r) {
            console.error("Error executing AG js: " + r);
        }
    },
    "(function(){var c=document.addEventListener;document.addEventListener=function(a,b,d,e){\"click\"!=a&&-1==b.toString().indexOf('trigerred')&&c(a,b,d,e)}.bind(document);})();": () => {
        try {
            !function() {
                var e = document.addEventListener;
                document.addEventListener = function(n, t, r, c) {
                    "click" != n && -1 == t.toString().indexOf("trigerred") && e(n, t, r, c);
                }.bind(document);
            }();
        } catch (e) {
            console.error("Error executing AG js: " + e);
        }
    },
    "document.addEventListener('DOMContentLoaded', function() { if (window.location.href.indexOf(\"hpinterstitialnew.html\") != -1) { window.setCookie1('sitecapture_interstitial', 1, 1); window.location.href = \"http://www.ndtv.com/\"; } })": () => {
        try {
            document.addEventListener("DOMContentLoaded", (function() {
                if (-1 != window.location.href.indexOf("hpinterstitialnew.html")) {
                    window.setCookie1("sitecapture_interstitial", 1, 1);
                    window.location.href = "http://www.ndtv.com/";
                }
            }));
        } catch (t) {
            console.error("Error executing AG js: " + t);
        }
    },
    "window.exo99HL3903jjdxtrnLoad = true;": () => {
        try {
            window.exo99HL3903jjdxtrnLoad = !0;
        } catch (r) {
            console.error("Error executing AG js: " + r);
        }
    },
    '(()=>{document.addEventListener("DOMContentLoaded",(()=>{ prerollskip(); setTimeout(function() { prerollskip(); }, 100); setTimeout(function() { prerollskip(); }, 300); }));})();': () => {
        try {
            document.addEventListener("DOMContentLoaded", (() => {
                prerollskip();
                setTimeout((function() {
                    prerollskip();
                }), 100);
                setTimeout((function() {
                    prerollskip();
                }), 300);
            }));
        } catch (e) {
            console.error("Error executing AG js: " + e);
        }
    },
    "!function(a,b){b=new MutationObserver(function(){a.classList.contains('idle')&&a.classList.remove('idle')}),b.observe(a,{attributes:!0,attributeFilter:['class']})}(document.documentElement);": () => {
        try {
            !function(e) {
                new MutationObserver((function() {
                    e.classList.contains("idle") && e.classList.remove("idle");
                })).observe(e, {
                    attributes: !0,
                    attributeFilter: [ "class" ]
                });
            }(document.documentElement);
        } catch (e) {
            console.error("Error executing AG js: " + e);
        }
    },
    "window.canRunAds = !0;": () => {
        try {
            window.canRunAds = !0;
        } catch (r) {
            console.error("Error executing AG js: " + r);
        }
    },
    "window.myatu_bgm = 0;": () => {
        try {
            window.myatu_bgm = 0;
        } catch (r) {
            console.error("Error executing AG js: " + r);
        }
    },
    "window.runad = function() {};": () => {
        try {
            window.runad = function() {};
        } catch (r) {
            console.error("Error executing AG js: " + r);
        }
    },
    "setTimeout(function() { window.show_popup=false; window.download_inited = true; }, 300);": () => {
        try {
            setTimeout((function() {
                window.show_popup = !1;
                window.download_inited = !0;
            }), 300);
        } catch (o) {
            console.error("Error executing AG js: " + o);
        }
    },
    "function setOverlayHTML() {};": () => {
        try {
            function setOverlayHTML() {}
        } catch (r) {
            console.error("Error executing AG js: " + r);
        }
    },
    "function setOverlayHTML_new() {};": () => {
        try {
            function setOverlayHTML_new() {}
        } catch (r) {
            console.error("Error executing AG js: " + r);
        }
    },
    "setTimeout(removeOverlayHTML, 2000);": () => {
        try {
            setTimeout(removeOverlayHTML, 2e3);
        } catch (e) {
            console.error("Error executing AG js: " + e);
        }
    },
    '(()=>{const e="loader.min.js",t={includes:String.prototype.includes,filter:Array.prototype.filter},l=()=>(new Error).stack,n={construct:(n,o,r)=>{const c=l();return t.includes.call(c,e)&&o[0]&&t.includes.call(o[0],"adshield")&&(o[0]=["(function(){})();"]),Reflect.construct(n,o,r)}};window.Blob=new Proxy(window.Blob,n);const o={apply:(n,o,r)=>{const c=l();return t.includes.call(c,e)&&r[0]&&t.includes.call(r[0],"new Error")&&(r[0]=()=>{}),Reflect.apply(n,o,r)}};window.setTimeout=new Proxy(window.setTimeout,o);const r={apply:(n,o,r)=>{const c=l();return t.includes.call(c,e)&&r[0]&&o?.includes?.("setTimeout")&&(o=t.filter.call(o,(e=>!t.includes.call(e,"setTimeout")))),Reflect.apply(n,o,r)}};window.Array.prototype.filter=new Proxy(window.Array.prototype.filter,r)})();': () => {
        try {
            (() => {
                const e = "loader.min.js", t = {
                    includes: String.prototype.includes,
                    filter: Array.prototype.filter
                }, r = () => (new Error).stack, l = {
                    construct: (l, o, n) => {
                        const c = r();
                        return t.includes.call(c, e) && o[0] && t.includes.call(o[0], "adshield") && (o[0] = [ "(function(){})();" ]), 
                        Reflect.construct(l, o, n);
                    }
                };
                window.Blob = new Proxy(window.Blob, l);
                const o = {
                    apply: (l, o, n) => {
                        const c = r();
                        return t.includes.call(c, e) && n[0] && t.includes.call(n[0], "new Error") && (n[0] = () => {}), 
                        Reflect.apply(l, o, n);
                    }
                };
                window.setTimeout = new Proxy(window.setTimeout, o);
                const n = {
                    apply: (l, o, n) => {
                        const c = r();
                        return t.includes.call(c, e) && n[0] && o?.includes?.("setTimeout") && (o = t.filter.call(o, (e => !t.includes.call(e, "setTimeout")))), 
                        Reflect.apply(l, o, n);
                    }
                };
                window.Array.prototype.filter = new Proxy(window.Array.prototype.filter, n);
            })();
        } catch (e) {
            console.error("Error executing AG js: " + e);
        }
    },
    '(()=>{const e={apply:(e,l,o)=>"link"===o[0]||"style"===o[0]?[]:Reflect.apply(e,l,o)};window.document.querySelectorAll=new Proxy(window.document.querySelectorAll,e)})();': () => {
        try {
            (() => {
                const e = {
                    apply: (e, l, o) => "link" === o[0] || "style" === o[0] ? [] : Reflect.apply(e, l, o)
                };
                window.document.querySelectorAll = new Proxy(window.document.querySelectorAll, e);
            })();
        } catch (e) {
            console.error("Error executing AG js: " + e);
        }
    },
    '(()=>{const t={apply:(t,e,n)=>{const o=Reflect.apply(t,e,n);try{o instanceof HTMLIFrameElement&&"about:blank"===o.src&&o.contentWindow&&(o.contentWindow.fetch=window.fetch)}catch(t){}return o}};Node.prototype.appendChild=new Proxy(Node.prototype.appendChild,t)})();': () => {
        try {
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
        } catch (e) {
            console.error("Error executing AG js: " + e);
        }
    },
    '(()=>{let t=document.location.href,e=[],n=[],o="",r=!1;const i=Array.prototype.push,a={apply:(t,o,a)=>(window.yt?.config_?.EXPERIMENT_FLAGS?.html5_enable_ssap_entity_id&&a[0]&&a[0]!==window&&"number"==typeof a[0].start&&a[0].end&&"ssap"===a[0].namespace&&a[0].id&&(r||0!==a[0]?.start||n.includes(a[0].id)||(e.length=0,n.length=0,r=!0,i.call(e,a[0]),i.call(n,a[0].id)),r&&0!==a[0]?.start&&!n.includes(a[0].id)&&(i.call(e,a[0]),i.call(n,a[0].id))),Reflect.apply(t,o,a))};window.Array.prototype.push=new Proxy(window.Array.prototype.push,a),document.addEventListener("DOMContentLoaded",(function(){if(!window.yt?.config_?.EXPERIMENT_FLAGS?.html5_enable_ssap_entity_id)return;const i=()=>{const t=document.querySelector("video");if(t&&e.length){const i=Math.round(t.duration),a=Math.round(e.at(-1).end/1e3),c=n.join(",");if(!1===t.loop&&o!==c&&i&&i===a){const n=e.at(-1).start/1e3;t.currentTime<n&&(t.currentTime=n,r=!1,o=c)}else if(!0===t.loop&&i&&i===a){const n=e.at(-1).start/1e3;t.currentTime<n&&(t.currentTime=n,r=!1,o=c)}}};i();new MutationObserver((()=>{t!==document.location.href&&(t=document.location.href,e.length=0,n.length=0,r=!1),i()})).observe(document,{childList:!0,subtree:!0})}))})();': () => {
        try {
            (() => {
                let t = document.location.href, e = [], n = [], o = "", r = !1;
                const i = Array.prototype.push, c = {
                    apply: (t, o, c) => (window.yt?.config_?.EXPERIMENT_FLAGS?.html5_enable_ssap_entity_id && c[0] && c[0] !== window && "number" == typeof c[0].start && c[0].end && "ssap" === c[0].namespace && c[0].id && (r || 0 !== c[0]?.start || n.includes(c[0].id) || (e.length = 0, 
                    n.length = 0, r = !0, i.call(e, c[0]), i.call(n, c[0].id)), r && 0 !== c[0]?.start && !n.includes(c[0].id) && (i.call(e, c[0]), 
                    i.call(n, c[0].id))), Reflect.apply(t, o, c))
                };
                window.Array.prototype.push = new Proxy(window.Array.prototype.push, c), document.addEventListener("DOMContentLoaded", (function() {
                    if (!window.yt?.config_?.EXPERIMENT_FLAGS?.html5_enable_ssap_entity_id) return;
                    const i = () => {
                        const t = document.querySelector("video");
                        if (t && e.length) {
                            const i = Math.round(t.duration), c = Math.round(e.at(-1).end / 1e3), a = n.join(",");
                            if (!1 === t.loop && o !== a && i && i === c) {
                                const n = e.at(-1).start / 1e3;
                                t.currentTime < n && (t.currentTime = n, r = !1, o = a);
                            } else if (!0 === t.loop && i && i === c) {
                                const n = e.at(-1).start / 1e3;
                                t.currentTime < n && (t.currentTime = n, r = !1, o = a);
                            }
                        }
                    };
                    i();
                    new MutationObserver((() => {
                        t !== document.location.href && (t = document.location.href, e.length = 0, n.length = 0, 
                        r = !1), i();
                    })).observe(document, {
                        childList: !0,
                        subtree: !0
                    });
                }));
            })();
        } catch (t) {
            console.error("Error executing AG js: " + t);
        }
    },
    '(()=>{window.JSON.parse=new Proxy(JSON.parse,{apply(r,e,t){const n=Reflect.apply(r,e,t);if(!location.pathname.startsWith("/shorts/"))return n;const a=n?.entries;return a&&Array.isArray(a)&&(n.entries=n.entries.filter((r=>{if(!r?.command?.reelWatchEndpoint?.adClientParams?.isAd)return r}))),n}});})();': () => {
        try {
            window.JSON.parse = new Proxy(JSON.parse, {
                apply(r, e, t) {
                    const n = Reflect.apply(r, e, t);
                    if (!location.pathname.startsWith("/shorts/")) return n;
                    const a = n?.entries;
                    return a && Array.isArray(a) && (n.entries = n.entries.filter((r => {
                        if (!r?.command?.reelWatchEndpoint?.adClientParams?.isAd) return r;
                    }))), n;
                }
            });
        } catch (r) {
            console.error("Error executing AG js: " + r);
        }
    },
    '(()=>{document.addEventListener("DOMContentLoaded",(()=>{document.querySelectorAll(\'a[href^="https://af.gog.com/game/"]\').forEach((t=>{const e=t.getAttribute("href").replace("https://af.gog.com/","https://www.gog.com/");t.setAttribute("href",e)}))}));})();': () => {
        try {
            document.addEventListener("DOMContentLoaded", (() => {
                document.querySelectorAll('a[href^="https://af.gog.com/game/"]').forEach((t => {
                    const e = t.getAttribute("href").replace("https://af.gog.com/", "https://www.gog.com/");
                    t.setAttribute("href", e);
                }));
            }));
        } catch (t) {
            console.error("Error executing AG js: " + t);
        }
    },
    'window.addEventListener("load",(()=>{window.stop()}));': () => {
        try {
            window.addEventListener("load", (() => {
                window.stop();
            }));
        } catch (o) {
            console.error("Error executing AG js: " + o);
        }
    },
    '(()=>{const e={apply:(e,t,n)=>{try{const[e,r]=n,a=r?.toString();if("click"===e&&a?.includes("attached")&&t instanceof HTMLElement&&t.matches(".share-embed-container"))return}catch(e){}return Reflect.apply(e,t,n)}};window.EventTarget.prototype.addEventListener=new Proxy(window.EventTarget.prototype.addEventListener,e)})();': () => {
        try {
            (() => {
                const e = {
                    apply: (e, t, n) => {
                        try {
                            const [e, r] = n, c = r?.toString();
                            if ("click" === e && c?.includes("attached") && t instanceof HTMLElement && t.matches(".share-embed-container")) return;
                        } catch (e) {}
                        return Reflect.apply(e, t, n);
                    }
                };
                window.EventTarget.prototype.addEventListener = new Proxy(window.EventTarget.prototype.addEventListener, e);
            })();
        } catch (e) {
            console.error("Error executing AG js: " + e);
        }
    },
    'document.cookie="dl-mobile-banner=hidden;path=/";': () => {
        try {
            document.cookie = "dl-mobile-banner=hidden;path=/";
        } catch (e) {
            console.error("Error executing AG js: " + e);
        }
    },
    'document.cookie="downloadcta-state=hidden;path=/";': () => {
        try {
            document.cookie = "downloadcta-state=hidden;path=/";
        } catch (o) {
            console.error("Error executing AG js: " + o);
        }
    },
    '(function(){-1==document.cookie.indexOf("native-app-topper")&&(document.cookie="native-app-topper="+Date.now()+"; path=/;",location.reload())})();': () => {
        try {
            -1 == document.cookie.indexOf("native-app-topper") && (document.cookie = "native-app-topper=" + Date.now() + "; path=/;", 
            location.reload());
        } catch (o) {
            console.error("Error executing AG js: " + o);
        }
    },
    '(function(){var a=new Date;a=a.getFullYear()+"-"+(a.getMonth()+1)+"-"+a.getDate();document.cookie="closed="+a})();': () => {
        try {
            !function() {
                var e = new Date;
                e = e.getFullYear() + "-" + (e.getMonth() + 1) + "-" + e.getDate();
                document.cookie = "closed=" + e;
            }();
        } catch (e) {
            console.error("Error executing AG js: " + e);
        }
    },
    'document.cookie="com.digidust.elokence.akinator.freemium-smartbanner-closed=true; path=/;";': () => {
        try {
            document.cookie = "com.digidust.elokence.akinator.freemium-smartbanner-closed=true; path=/;";
        } catch (e) {
            console.error("Error executing AG js: " + e);
        }
    },
    'document.cookie="sb-closed=true; path=/;";': () => {
        try {
            document.cookie = "sb-closed=true; path=/;";
        } catch (e) {
            console.error("Error executing AG js: " + e);
        }
    },
    "(function(){var b=window.setTimeout;window.setTimeout=function(a,c){if(!/loadAppStoreBanner/.test(a.toString()))return b(a,c)};})();": () => {
        try {
            !function() {
                var t = window.setTimeout;
                window.setTimeout = function(o, r) {
                    if (!/loadAppStoreBanner/.test(o.toString())) return t(o, r);
                };
            }();
        } catch (t) {
            console.error("Error executing AG js: " + t);
        }
    },
    "(()=>{try{\"undefined\"!=typeof sessionStorage&&sessionStorage.setItem('status_of_app_redirect_half_modal_on_coordinate_list','{\"displayed\":true}')}catch(e){}})();": () => {
        try {
            (() => {
                try {
                    "undefined" != typeof sessionStorage && sessionStorage.setItem("status_of_app_redirect_half_modal_on_coordinate_list", '{"displayed":true}');
                } catch (e) {}
            })();
        } catch (e) {
            console.error("Error executing AG js: " + e);
        }
    },
    '(()=>{var b=EventTarget.prototype.addEventListener,c=function(a,b){var c=document.querySelector("button.AppHeader-login");c&&b.bind(c)("click",function(){d.disconnect()},{once:!0})},d=new MutationObserver(function(){var a=document.querySelector(".Modal-wrapper .signFlowModal > .Modal-closeButton");a&&(d.disconnect(),e.disconnect(),a.click())});d.observe(document,{childList:!0,subtree:!0});var e=new MutationObserver(a=>{c(a,b)});e.observe(document,{childList:!0,subtree:!0}),setTimeout(function(){e.disconnect(),d.disconnect()},5E3)})();': () => {
        try {
            (() => {
                var e = EventTarget.prototype.addEventListener, t = new MutationObserver((function() {
                    var e = document.querySelector(".Modal-wrapper .signFlowModal > .Modal-closeButton");
                    e && (t.disconnect(), n.disconnect(), e.click());
                }));
                t.observe(document, {
                    childList: !0,
                    subtree: !0
                });
                var n = new MutationObserver((n => {
                    !function(e, n) {
                        var o = document.querySelector("button.AppHeader-login");
                        o && n.bind(o)("click", (function() {
                            t.disconnect();
                        }), {
                            once: !0
                        });
                    }(0, e);
                }));
                n.observe(document, {
                    childList: !0,
                    subtree: !0
                }), setTimeout((function() {
                    n.disconnect(), t.disconnect();
                }), 5e3);
            })();
        } catch (e) {
            console.error("Error executing AG js: " + e);
        }
    },
    '(function(){if(!document.cookie.includes("zip_and_city=")){var a=encodeURIComponent(\'{"zip":"","city":""}\');document.cookie="zip_and_city="+a+"; path=/;"}})();': () => {
        try {
            !function() {
                if (!document.cookie.includes("zip_and_city=")) {
                    var c = encodeURIComponent('{"zip":"","city":""}');
                    document.cookie = "zip_and_city=" + c + "; path=/;";
                }
            }();
        } catch (c) {
            console.error("Error executing AG js: " + c);
        }
    },
    "(function(){var b=window.alert;window.alert=function(a){if(!/do geolokalizacji/.test(a.toString()))return b(a)};})();": () => {
        try {
            !function() {
                var r = window.alert;
                window.alert = function(o) {
                    if (!/do geolokalizacji/.test(o.toString())) return r(o);
                };
            }();
        } catch (r) {
            console.error("Error executing AG js: " + r);
        }
    },
    '!function(){if(decodeURIComponent(location.href).startsWith("https://www.wp.pl/?s=portal.abczdrowie.pl")||decodeURIComponent(location.href).startsWith("https://www.wp.pl/?s=parenting.pl"))try{var a=(new URL(window.location.href)).searchParams.get("s");location.replace("https://"+a)}catch(b){}}();': () => {
        try {
            !function() {
                if (decodeURIComponent(location.href).startsWith("https://www.wp.pl/?s=portal.abczdrowie.pl") || decodeURIComponent(location.href).startsWith("https://www.wp.pl/?s=parenting.pl")) try {
                    var t = new URL(window.location.href).searchParams.get("s");
                    location.replace("https://" + t);
                } catch (t) {}
            }();
        } catch (t) {
            console.error("Error executing AG js: " + t);
        }
    },
    '!function(){if(decodeURIComponent(location.href).startsWith("https://www.wp.pl/?s=https://"))try{var a=(new URL(window.location.href)).searchParams.get("s");location.replace(a)}catch(b){}}();': () => {
        try {
            !function() {
                if (decodeURIComponent(location.href).startsWith("https://www.wp.pl/?s=https://")) try {
                    var t = new URL(window.location.href).searchParams.get("s");
                    location.replace(t);
                } catch (t) {}
            }();
        } catch (t) {
            console.error("Error executing AG js: " + t);
        }
    },
    '(function(){var a=new Date,b=a.getTime();document.cookie="ucs=lbit="+b})();': () => {
        try {
            !function() {
                var e = (new Date).getTime();
                document.cookie = "ucs=lbit=" + e;
            }();
        } catch (e) {
            console.error("Error executing AG js: " + e);
        }
    },
    "var _st = window.setTimeout; window.setTimeout = function(a, b) { if(!/loginPopup.show/.test(a)){ _st(a,b);}};": () => {
        try {
            var _st = window.setTimeout;
            window.setTimeout = function(o, t) {
                /loginPopup.show/.test(o) || _st(o, t);
            };
        } catch (o) {
            console.error("Error executing AG js: " + o);
        }
    },
    '!function(){var e=new MutationObserver(function(){document.querySelectorAll(\'div[id^="substream_"] div[id^="hyperfeed_story_id"]\').forEach(function(e){var n=e.querySelectorAll(".userContentWrapper > div[class] > div[class] > div[class]"),o=e.querySelectorAll(".userContentWrapper > div[class] > div > div span");if("display: none !important;"!=e.getAttribute("style")){if(0<n.length&&n[0].innerText.contains("Suggested")){console.log("--------"),t+=1;var l=e.querySelectorAll("a[href]")[2].innerText;console.log("Annoyance hidden from: "+l),console.log("Total annoyances Hidden: "+t),console.log("F length: "+n.length),console.log("--------"),e.style="display:none!important;"}if(0<o.length&&o[0].innerText.contains("People you may know"))console.log("--------"),t+=1,""==(l=e.querySelectorAll("a[href]")[2].innerText)&&(l="Facebook"),console.log("Annoyance hidden from: "+l),console.log("Total annoyances Hidden: "+t),console.log("F length: "+n.length),console.log("--------"),e.style="display:none!important;"}})}),t=0;e.observe(document,{childList:!0,subtree:!0})}();': () => {
        try {
            !function() {
                var e = new MutationObserver((function() {
                    document.querySelectorAll('div[id^="substream_"] div[id^="hyperfeed_story_id"]').forEach((function(e) {
                        var o = e.querySelectorAll(".userContentWrapper > div[class] > div[class] > div[class]"), l = e.querySelectorAll(".userContentWrapper > div[class] > div > div span");
                        if ("display: none !important;" != e.getAttribute("style")) {
                            if (0 < o.length && o[0].innerText.contains("Suggested")) {
                                console.log("--------"), n += 1;
                                var t = e.querySelectorAll("a[href]")[2].innerText;
                                console.log("Annoyance hidden from: " + t), console.log("Total annoyances Hidden: " + n), 
                                console.log("F length: " + o.length), console.log("--------"), e.style = "display:none!important;";
                            }
                            0 < l.length && l[0].innerText.contains("People you may know") && (console.log("--------"), 
                            n += 1, "" == (t = e.querySelectorAll("a[href]")[2].innerText) && (t = "Facebook"), 
                            console.log("Annoyance hidden from: " + t), console.log("Total annoyances Hidden: " + n), 
                            console.log("F length: " + o.length), console.log("--------"), e.style = "display:none!important;");
                        }
                    }));
                })), n = 0;
                e.observe(document, {
                    childList: !0,
                    subtree: !0
                });
            }();
        } catch (e) {
            console.error("Error executing AG js: " + e);
        }
    },
    'new MutationObserver(function(){document.querySelectorAll(\'div[role="feed"] > div[data-pagelet^="FeedUnit"] > div[class]:not([style*="height"])\').forEach(function(e){"display: none !important;"==e.getAttribute("style")||e.classList.contains("hidden_elem")||e.querySelectorAll("div[aria-posinset] div[style] div[class] > div[class] > div[class] > div[class] > span")[0].innerText.contains("Suggested for you")&&(console.log("--------"),console.log("Annoyances hidden (Suggested for you)"),e.style="display:none!important;")})}).observe(document,{childList:!0,subtree:!0});': () => {
        try {
            new MutationObserver((function() {
                document.querySelectorAll('div[role="feed"] > div[data-pagelet^="FeedUnit"] > div[class]:not([style*="height"])').forEach((function(e) {
                    "display: none !important;" == e.getAttribute("style") || e.classList.contains("hidden_elem") || e.querySelectorAll("div[aria-posinset] div[style] div[class] > div[class] > div[class] > div[class] > span")[0].innerText.contains("Suggested for you") && (console.log("--------"), 
                    console.log("Annoyances hidden (Suggested for you)"), e.style = "display:none!important;");
                }));
            })).observe(document, {
                childList: !0,
                subtree: !0
            });
        } catch (e) {
            console.error("Error executing AG js: " + e);
        }
    },
    'new MutationObserver(function(){document.querySelectorAll(\'div[role="feed"] > span\').forEach(function(e){"display: none !important;"==e.getAttribute("style")||e.classList.contains("hidden_elem")||e.querySelectorAll("div[aria-posinset] div[style] div[class] > div[class] > div[class] > div[class] > span")[0].innerText.contains("Suggested for you")&&(console.log("--------"),console.log("Annoyances hidden (Suggested for you)"),e.style="display:none!important;")})}).observe(document,{childList:!0,subtree:!0});': () => {
        try {
            new MutationObserver((function() {
                document.querySelectorAll('div[role="feed"] > span').forEach((function(e) {
                    "display: none !important;" == e.getAttribute("style") || e.classList.contains("hidden_elem") || e.querySelectorAll("div[aria-posinset] div[style] div[class] > div[class] > div[class] > div[class] > span")[0].innerText.contains("Suggested for you") && (console.log("--------"), 
                    console.log("Annoyances hidden (Suggested for you)"), e.style = "display:none!important;");
                }));
            })).observe(document, {
                childList: !0,
                subtree: !0
            });
        } catch (e) {
            console.error("Error executing AG js: " + e);
        }
    },
    '!function(){var b=0,d=[];new MutationObserver(function(){document.querySelectorAll("#ssrb_feed_start + div > div[class]:not([style*=\\"display: none\\"]), #ssrb_feed_start + div span > h3 ~ div[class]:not([style*=\\"display: none\\"]), #ssrb_feed_start + div h3~ div[class]:not([style*=\\"display: none\\"]), #ssrb_feed_start + div h3 ~ div > div[class]:not([style*=\\"display: none\\"]), div[role=\\"main\\"] div > h3 ~ div > div[class]:not([style*=\\"display: none\\"])").forEach(function(e){Object.keys(e).forEach(function(a){if(a.includes("__reactEvents")||a.includes("__reactProps")){a=e[a];try{if(a.children?.props?.category?.includes("SHOWCASE")||a.children?.props?.children?.props?.category?.includes("SHOWCASE")||a.children?.props?.children?.props?.feedEdge?.category?.includes("SHOWCASE")||a.children?.props?.category?.includes("FB_SHORTS")||a.children?.props?.children?.props?.category?.includes("FB_SHORTS")||a.children?.props?.children?.props?.feedEdge?.category?.includes("FB_SHORTS")){b++,e.style="display: none !important;";var f=e.querySelector("a[href][aria-label]:not([aria-hidden])");f&&(d.push(["SHOWCASE post blocked based on property ["+b+"] -> "+f.ariaLabel]),console.table(d))}}catch(a){}}})})}).observe(document,{childList:!0,subtree:!0})}();': () => {
        try {
            !function() {
                var e = 0, s = [];
                new MutationObserver((function() {
                    document.querySelectorAll('#ssrb_feed_start + div > div[class]:not([style*="display: none"]), #ssrb_feed_start + div span > h3 ~ div[class]:not([style*="display: none"]), #ssrb_feed_start + div h3~ div[class]:not([style*="display: none"]), #ssrb_feed_start + div h3 ~ div > div[class]:not([style*="display: none"]), div[role="main"] div > h3 ~ div > div[class]:not([style*="display: none"])').forEach((function(r) {
                        Object.keys(r).forEach((function(n) {
                            if (n.includes("__reactEvents") || n.includes("__reactProps")) {
                                n = r[n];
                                try {
                                    if (n.children?.props?.category?.includes("SHOWCASE") || n.children?.props?.children?.props?.category?.includes("SHOWCASE") || n.children?.props?.children?.props?.feedEdge?.category?.includes("SHOWCASE") || n.children?.props?.category?.includes("FB_SHORTS") || n.children?.props?.children?.props?.category?.includes("FB_SHORTS") || n.children?.props?.children?.props?.feedEdge?.category?.includes("FB_SHORTS")) {
                                        e++, r.style = "display: none !important;";
                                        var i = r.querySelector("a[href][aria-label]:not([aria-hidden])");
                                        i && (s.push([ "SHOWCASE post blocked based on property [" + e + "] -> " + i.ariaLabel ]), 
                                        console.table(s));
                                    }
                                } catch (n) {}
                            }
                        }));
                    }));
                })).observe(document, {
                    childList: !0,
                    subtree: !0
                });
            }();
        } catch (e) {
            console.error("Error executing AG js: " + e);
        }
    },
    "setInterval(function() { var el = document.querySelector('.howto-video video'); if (el) { el.pause(); el.src = ''; }}, 100);": () => {
        try {
            setInterval((function() {
                var e = document.querySelector(".howto-video video");
                if (e) {
                    e.pause();
                    e.src = "";
                }
            }), 100);
        } catch (e) {
            console.error("Error executing AG js: " + e);
        }
    },
    'document.addEventListener(\'DOMContentLoaded\', function(){setTimeout(function(){var a=document.querySelector(".onp-sl-content");if("function"===typeof jQuery&&"object"===typeof bizpanda.lockerOptions&&a)try{a=0;for(var c=Object.keys(bizpanda.lockerOptions);a<c.length;a++){var d=c[a];if(d.includes("onpLock")){var b=bizpanda.lockerOptions[d];b&&jQuery.ajax({url:b.ajaxUrl,method:"post",data:{lockerId:b.lockerId,action:"opanda_loader",hash:b.contentHash},success:function(a){var b=jQuery(".onp-sl-content"),c=jQuery(".onp-sl-social-locker"); b.append(a);b.css("display","block");c.css("display","none")}})}}}catch(e){}},1E3)});': () => {
        try {
            document.addEventListener("DOMContentLoaded", (function() {
                setTimeout((function() {
                    var o = document.querySelector(".onp-sl-content");
                    if ("function" == typeof jQuery && "object" == typeof bizpanda.lockerOptions && o) try {
                        o = 0;
                        for (var e = Object.keys(bizpanda.lockerOptions); o < e.length; o++) {
                            var n = e[o];
                            if (n.includes("onpLock")) {
                                var t = bizpanda.lockerOptions[n];
                                t && jQuery.ajax({
                                    url: t.ajaxUrl,
                                    method: "post",
                                    data: {
                                        lockerId: t.lockerId,
                                        action: "opanda_loader",
                                        hash: t.contentHash
                                    },
                                    success: function(o) {
                                        var e = jQuery(".onp-sl-content"), n = jQuery(".onp-sl-social-locker");
                                        e.append(o);
                                        e.css("display", "block");
                                        n.css("display", "none");
                                    }
                                });
                            }
                        }
                    } catch (o) {}
                }), 1e3);
            }));
        } catch (o) {
            console.error("Error executing AG js: " + o);
        }
    },
    '(async()=>{if(location.href.includes("?slid="))try{const t=new URLSearchParams(location.search).get("slid");if(!t||!t.length)return;const a=await fetch(`https://hotmediahub.com/shorturl/getoriginurl?&surl_key=${t}`),i=await a.json();i?.data?.origin_url&&i.data.origin_url.startsWith("http")&&location.assign(i.data.origin_url)}catch(t){console.debug(t)}})();': () => {
        try {
            (async () => {
                if (location.href.includes("?slid=")) try {
                    const t = new URLSearchParams(location.search).get("slid");
                    if (!t || !t.length) return;
                    const r = await fetch(`https://hotmediahub.com/shorturl/getoriginurl?&surl_key=${t}`), a = await r.json();
                    a?.data?.origin_url && a.data.origin_url.startsWith("http") && location.assign(a.data.origin_url);
                } catch (t) {
                    console.debug(t);
                }
            })();
        } catch (t) {
            console.error("Error executing AG js: " + t);
        }
    },
    '(async()=>{if(location.href.includes("/slmiddlepage/"))try{const t=location.href.split("/").at(-1);if(!t.length)return;const a=await fetch(`https://terabox.fun/api/shortlink/getoriginurl?&encrypt_surl_key=${t}`),i=await a.json();i?.data?.origin_url&&i.data.origin_url.startsWith("http")&&location.assign(i.data.origin_url)}catch(t){console.debug(t)}})();': () => {
        try {
            (async () => {
                if (location.href.includes("/slmiddlepage/")) try {
                    const t = location.href.split("/").at(-1);
                    if (!t.length) return;
                    const r = await fetch(`https://terabox.fun/api/shortlink/getoriginurl?&encrypt_surl_key=${t}`), i = await r.json();
                    i?.data?.origin_url && i.data.origin_url.startsWith("http") && location.assign(i.data.origin_url);
                } catch (t) {
                    console.debug(t);
                }
            })();
        } catch (t) {
            console.error("Error executing AG js: " + t);
        }
    },
    '(async()=>{if(location.href.includes("/sl/"))try{const t=location.href.split("/").at(-1);if(!t.length)return;const a=await fetch(`https://terabox.fun/shorturl/getoriginurl?&surl_key=${t}`),i=await a.json();i?.data?.origin_url&&i.data.origin_url.startsWith("http")&&location.assign(i.data.origin_url)}catch(t){console.debug(t)}})();': () => {
        try {
            (async () => {
                if (location.href.includes("/sl/")) try {
                    const t = location.href.split("/").at(-1);
                    if (!t.length) return;
                    const r = await fetch(`https://terabox.fun/shorturl/getoriginurl?&surl_key=${t}`), o = await r.json();
                    o?.data?.origin_url && o.data.origin_url.startsWith("http") && location.assign(o.data.origin_url);
                } catch (t) {
                    console.debug(t);
                }
            })();
        } catch (t) {
            console.error("Error executing AG js: " + t);
        }
    },
    '(function(){try{var a=location.href.split("/#");if(a[1]){a=a[1];for(var b=0;10>b;b++){a=atob(a);try{new URL(decodeURIComponent(a));var c=!0}catch(d){c=!1}if(c)try{location.assign(decodeURIComponent(a));break}catch(d){}}}}catch(d){}})();': () => {
        try {
            !function() {
                try {
                    var o = location.href.split("/#");
                    if (o[1]) {
                        o = o[1];
                        for (var r = 0; 10 > r; r++) {
                            o = atob(o);
                            try {
                                new URL(decodeURIComponent(o));
                                var t = !0;
                            } catch (o) {
                                t = !1;
                            }
                            if (t) try {
                                location.assign(decodeURIComponent(o));
                                break;
                            } catch (o) {}
                        }
                    }
                } catch (o) {}
            }();
        } catch (o) {
            console.error("Error executing AG js: " + o);
        }
    },
    '(function(){if(location.href.includes("/aHR0c"))try{let a=location.href.substring(location.href.indexOf("aHR0c"));a=atob(a),location.assign(decodeURIComponent(a))}catch(a){}})();': () => {
        try {
            !function() {
                if (location.href.includes("/aHR0c")) try {
                    let o = location.href.substring(location.href.indexOf("aHR0c"));
                    o = atob(o), location.assign(decodeURIComponent(o));
                } catch (o) {}
            }();
        } catch (o) {
            console.error("Error executing AG js: " + o);
        }
    },
    '(()=>{if(location.href.includes("?s=http")){const a=location.href.split("?s=").slice(1);try{location.assign(a)}catch(a){}}})();': () => {
        try {
            (() => {
                if (location.href.includes("?s=http")) {
                    const c = location.href.split("?s=").slice(1);
                    try {
                        location.assign(c);
                    } catch (c) {}
                }
            })();
        } catch (c) {
            console.error("Error executing AG js: " + c);
        }
    },
    '!function(){if(location.href.includes("wpsafelink")){var e=new MutationObserver((function(){try{var t=document.querySelector(\'form#landing > input[name="go"][value]\'),n=document.querySelector("body > script");t&&t.value.startsWith("aHR0c")&&n&&n.textContent.includes("document.getElementById(\'landing\').submit();")&&(n.remove(),e.disconnect(),location.assign(atob(t.value)))}catch(e){}}));e.observe(document,{childList:!0,subtree:!0}),setTimeout((function(){e.disconnect()}),1e4)}}();': () => {
        try {
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
        } catch (e) {
            console.error("Error executing AG js: " + e);
        }
    },
    '!function(){if(-1<location.href.indexOf("?data=aHR0c")){var a=(new URL(window.location.href)).searchParams.get("data");if(a)try{window.location.assign(atob(a))}catch(b){}}}();': () => {
        try {
            !function() {
                if (-1 < location.href.indexOf("?data=aHR0c")) {
                    var a = new URL(window.location.href).searchParams.get("data");
                    if (a) try {
                        window.location.assign(atob(a));
                    } catch (a) {}
                }
            }();
        } catch (a) {
            console.error("Error executing AG js: " + a);
        }
    },
    '!function(){if(-1<location.href.indexOf("?wpsafelink=http")){var a=(new URL(window.location.href)).searchParams.get("wpsafelink");if(a)try{window.location.assign(a)}catch(b){}}}();': () => {
        try {
            !function() {
                if (-1 < location.href.indexOf("?wpsafelink=http")) {
                    var n = new URL(window.location.href).searchParams.get("wpsafelink");
                    if (n) try {
                        window.location.assign(n);
                    } catch (n) {}
                }
            }();
        } catch (n) {
            console.error("Error executing AG js: " + n);
        }
    },
    '!function(){if(-1<window.location.href.indexOf("/?go=")){var a=location.href.split("?go=");if(a&&a[1])try{window.location=atob(a[1])}catch(b){}}}();': () => {
        try {
            !function() {
                if (-1 < window.location.href.indexOf("/?go=")) {
                    var o = location.href.split("?go=");
                    if (o && o[1]) try {
                        window.location = atob(o[1]);
                    } catch (o) {}
                }
            }();
        } catch (o) {
            console.error("Error executing AG js: " + o);
        }
    },
    '!function(){if(-1<window.location.href.indexOf("/?redirect=aHR0c")){var a=location.href.split("/?redirect=");if(a&&a[1])try{window.location=atob(a[1])}catch(b){}}}();': () => {
        try {
            !function() {
                if (-1 < window.location.href.indexOf("/?redirect=aHR0c")) {
                    var r = location.href.split("/?redirect=");
                    if (r && r[1]) try {
                        window.location = atob(r[1]);
                    } catch (r) {}
                }
            }();
        } catch (r) {
            console.error("Error executing AG js: " + r);
        }
    },
    '!function(){if(-1<location.href.indexOf("?data=")){var b=(new URL(window.location.href)).searchParams.get("data");if(b)try{var a=atob(b);a=a.split("&ulink=")[1];a.startsWith("http")&&window.location.assign(a)}catch(c){}}}();': () => {
        try {
            !function() {
                if (-1 < location.href.indexOf("?data=")) {
                    var t = new URL(window.location.href).searchParams.get("data");
                    if (t) try {
                        var a = atob(t);
                        (a = a.split("&ulink=")[1]).startsWith("http") && window.location.assign(a);
                    } catch (t) {}
                }
            }();
        } catch (t) {
            console.error("Error executing AG js: " + t);
        }
    },
    '!function(){if(-1<window.location.href.indexOf("/?r=aHR0c")){var a=location.href.split("/?r=");if(a&&a[1])try{window.location=atob(a[1])}catch(b){}}}();': () => {
        try {
            !function() {
                if (-1 < window.location.href.indexOf("/?r=aHR0c")) {
                    var o = location.href.split("/?r=");
                    if (o && o[1]) try {
                        window.location = atob(o[1]);
                    } catch (o) {}
                }
            }();
        } catch (o) {
            console.error("Error executing AG js: " + o);
        }
    },
    '(function(){if(location.href.includes("/to/aHR0c"))try{var a=location.href.split("/to/");a=atob(a[1]).split("url=");location=decodeURIComponent(a[1])}catch(b){}})();': () => {
        try {
            !function() {
                if (location.href.includes("/to/aHR0c")) try {
                    var o = location.href.split("/to/");
                    o = atob(o[1]).split("url=");
                    location = decodeURIComponent(o[1]);
                } catch (o) {}
            }();
        } catch (o) {
            console.error("Error executing AG js: " + o);
        }
    },
    '(function(){"function"===typeof fetch&&location.href.includes("/?id=")&&fetch(location.href).then(function(e){e.headers.forEach(function(a,f){if("refresh"===f&&a.includes("url=http"))try{if(a.includes("&url=aHR0c")){var b,c=null==(b=a.split(/&url=/))?void 0:b[1];location=atob(c)}else{var d;location=c=null==(d=a.split(/url=(.+)/))?void 0:d[1]}}catch(g){}})})})();': () => {
        try {
            "function" == typeof fetch && location.href.includes("/?id=") && fetch(location.href).then((function(t) {
                t.headers.forEach((function(t, c) {
                    if ("refresh" === c && t.includes("url=http")) try {
                        if (t.includes("&url=aHR0c")) {
                            var o, r = null == (o = t.split(/&url=/)) ? void 0 : o[1];
                            location = atob(r);
                        } else {
                            var e;
                            location = r = null == (e = t.split(/url=(.+)/)) ? void 0 : e[1];
                        }
                    } catch (t) {}
                }));
            }));
        } catch (t) {
            console.error("Error executing AG js: " + t);
        }
    },
    '!function(){if(-1<window.location.href.indexOf("out/?aHR0c")){var a=location.href.split("out/?");if(a&&a[1])try{window.location=atob(decodeURIComponent(a[1]))}catch(b){}}}();': () => {
        try {
            !function() {
                if (-1 < window.location.href.indexOf("out/?aHR0c")) {
                    var o = location.href.split("out/?");
                    if (o && o[1]) try {
                        window.location = atob(decodeURIComponent(o[1]));
                    } catch (o) {}
                }
            }();
        } catch (o) {
            console.error("Error executing AG js: " + o);
        }
    },
    '!function(){if(window.location.href.includes("api")&&window.location.href.includes("&url=")){var b=location.href.split("&url=")[1];a:{try{var a=new URL(b)}catch(c){a=!1;break a}a="http:"===a.protocol||"https:"===a.protocol}if(a)try{window.location=b}catch(c){}}}();': () => {
        try {
            !function() {
                if (window.location.href.includes("api") && window.location.href.includes("&url=")) {
                    var o = location.href.split("&url=")[1];
                    o: {
                        try {
                            var r = new URL(o);
                        } catch (o) {
                            r = !1;
                            break o;
                        }
                        r = "http:" === r.protocol || "https:" === r.protocol;
                    }
                    if (r) try {
                        window.location = o;
                    } catch (o) {}
                }
            }();
        } catch (o) {
            console.error("Error executing AG js: " + o);
        }
    },
    '!function(){if(-1<window.location.href.indexOf("/download.php?")&&-1<window.location.href.indexOf("link=aHR0c")){var a=location.href.split("link=");if(a&&a[1])try{window.location=atob(a[1])}catch(b){}}}();': () => {
        try {
            !function() {
                if (-1 < window.location.href.indexOf("/download.php?") && -1 < window.location.href.indexOf("link=aHR0c")) {
                    var o = location.href.split("link=");
                    if (o && o[1]) try {
                        window.location = atob(o[1]);
                    } catch (o) {}
                }
            }();
        } catch (o) {
            console.error("Error executing AG js: " + o);
        }
    },
    '(()=>{document.addEventListener(\'DOMContentLoaded\',()=>{const a=function(a){const b=new DOMParser().parseFromString(a,"text/html");return b.documentElement.textContent},b=function(){if("object"==typeof _sharedData&&"string"==typeof _sharedData[0]?.destination){const b=a(_sharedData[0].destination);if(b.startsWith("http"))try{window.location=b}catch(a){}}};if(window._sharedData)b();else{const a=new MutationObserver(function(){window._sharedData&&(a.disconnect(),b())});a.observe(document,{childList:!0,subtree:!0}),setTimeout(function(){a.disconnect()},1E4)}})})();': () => {
        try {
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
        } catch (t) {
            console.error("Error executing AG js: " + t);
        }
    },
    '!function(){if(-1<window.location.href.indexOf(".html?url=aHR0c")){var a=location.href.split(".html?url=");if(a&&a[1])try{window.location=atob(a[1])}catch(b){}}}();': () => {
        try {
            !function() {
                if (-1 < window.location.href.indexOf(".html?url=aHR0c")) {
                    var o = location.href.split(".html?url=");
                    if (o && o[1]) try {
                        window.location = atob(o[1]);
                    } catch (o) {}
                }
            }();
        } catch (o) {
            console.error("Error executing AG js: " + o);
        }
    },
    '!function(){if(-1<location.href.indexOf("/aHR0c")){var a=location.href.split("/").pop();if(a&&a.includes("aHR0c"))try{location=decodeURIComponent(atob(a))}catch(b){}}}();': () => {
        try {
            !function() {
                if (-1 < location.href.indexOf("/aHR0c")) {
                    var o = location.href.split("/").pop();
                    if (o && o.includes("aHR0c")) try {
                        location = decodeURIComponent(atob(o));
                    } catch (o) {}
                }
            }();
        } catch (o) {
            console.error("Error executing AG js: " + o);
        }
    },
    '!function(){if(-1<window.location.href.indexOf("/gotothedl.html?url=")){var a=location.href.split("/gotothedl.html?url=");if(a&&a[1])try{window.location=atob(a[1])}catch(b){}}}();': () => {
        try {
            !function() {
                if (-1 < window.location.href.indexOf("/gotothedl.html?url=")) {
                    var o = location.href.split("/gotothedl.html?url=");
                    if (o && o[1]) try {
                        window.location = atob(o[1]);
                    } catch (o) {}
                }
            }();
        } catch (o) {
            console.error("Error executing AG js: " + o);
        }
    },
    '!function(){if(-1<window.location.href.indexOf("/link/?link=aHR0c")){var a=location.href.split("/link/?link=");if(a&&a[1])try{window.location=atob(a[1])}catch(b){}}}();': () => {
        try {
            !function() {
                if (-1 < window.location.href.indexOf("/link/?link=aHR0c")) {
                    var i = location.href.split("/link/?link=");
                    if (i && i[1]) try {
                        window.location = atob(i[1]);
                    } catch (i) {}
                }
            }();
        } catch (i) {
            console.error("Error executing AG js: " + i);
        }
    },
    "!function(){if(-1<location.search.indexOf(\"=redirect&href=\")){var url=new URL(window.location.href); var dest=url.searchParams.get('href'); if(dest){location=dest;}}}();": () => {
        try {
            !function() {
                if (-1 < location.search.indexOf("=redirect&href=")) {
                    var r = new URL(window.location.href).searchParams.get("href");
                    r && (location = r);
                }
            }();
        } catch (r) {
            console.error("Error executing AG js: " + r);
        }
    },
    '!function(){if(-1<location.pathname.indexOf("/view.php")){var a=(new URL(window.location.href)).searchParams.get("id");if(a&&-1==document.cookie.indexOf(a))try{document.cookie=a+"=user; path=/;";location.reload();}catch(b){}}}();': () => {
        try {
            !function() {
                if (-1 < location.pathname.indexOf("/view.php")) {
                    var o = new URL(window.location.href).searchParams.get("id");
                    if (o && -1 == document.cookie.indexOf(o)) try {
                        document.cookie = o + "=user; path=/;";
                        location.reload();
                    } catch (o) {}
                }
            }();
        } catch (o) {
            console.error("Error executing AG js: " + o);
        }
    },
    '(function(){-1==document.cookie.indexOf("exUserId")&&(document.cookie="exUserId=1; domain=.4shared.com; path=/;")})();': () => {
        try {
            -1 == document.cookie.indexOf("exUserId") && (document.cookie = "exUserId=1; domain=.4shared.com; path=/;");
        } catch (e) {
            console.error("Error executing AG js: " + e);
        }
    },
    '!function(){if(-1<location.pathname.indexOf("/redirect")){var a=(new URL(window.location.href)).searchParams.get("to");if(a)try{window.location=atob(a)}catch(b){}}}();': () => {
        try {
            !function() {
                if (-1 < location.pathname.indexOf("/redirect")) {
                    var o = new URL(window.location.href).searchParams.get("to");
                    if (o) try {
                        window.location = atob(o);
                    } catch (o) {}
                }
            }();
        } catch (o) {
            console.error("Error executing AG js: " + o);
        }
    },
    '!function(){if(-1<window.location.href.indexOf("?url=")){var a=location.href.split("?url=");if(a&&a[1])try{window.location=atob(a[1])}catch(b){}}}();': () => {
        try {
            !function() {
                if (-1 < window.location.href.indexOf("?url=")) {
                    var o = location.href.split("?url=");
                    if (o && o[1]) try {
                        window.location = atob(o[1]);
                    } catch (o) {}
                }
            }();
        } catch (o) {
            console.error("Error executing AG js: " + o);
        }
    },
    '(()=>{document.addEventListener(\'DOMContentLoaded\',()=>{if(-1<location.pathname.indexOf("/go/")){var b=new MutationObserver(function(){if(document.querySelector("#get_link_btn"))try{[].slice.call(document.getElementsByTagName("script")).some(function(a){a.text.match(/goToUrl \\("/)&&(a=a.text.split(/goToUrl \\("([\\s\\S]*?)"\\);/),location=a[1])})}catch(a){}});b.observe(document,{childList:!0,subtree:!0});setTimeout(function(){b.disconnect()},1E4)}})})();': () => {
        try {
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
        } catch (e) {
            console.error("Error executing AG js: " + e);
        }
    },
    "document.addEventListener('DOMContentLoad', function() { setTimeout(function() { second = 0; }, 300); });": () => {
        try {
            document.addEventListener("DOMContentLoad", (function() {
                setTimeout((function() {
                    second = 0;
                }), 300);
            }));
        } catch (e) {
            console.error("Error executing AG js: " + e);
        }
    },
    '!function(){if(-1<window.location.href.indexOf("/?r=")){var a=location.href.split("?r=");if(a&&a[1])try{window.location=atob(a[1])}catch(b){}}}();': () => {
        try {
            !function() {
                if (-1 < window.location.href.indexOf("/?r=")) {
                    var o = location.href.split("?r=");
                    if (o && o[1]) try {
                        window.location = atob(o[1]);
                    } catch (o) {}
                }
            }();
        } catch (o) {
            console.error("Error executing AG js: " + o);
        }
    },
    "(function(){var c=window.setInterval;window.setInterval=function(f,g){return g===1e3&&/removeAttr\\('disabled'\\)/.test(f.toString())&&(g*=0.01),c.apply(this,arguments)}.bind(window)})();": () => {
        try {
            !function() {
                var t = window.setInterval;
                window.setInterval = function(r, e) {
                    return 1e3 === e && /removeAttr\('disabled'\)/.test(r.toString()) && (e *= .01), 
                    t.apply(this, arguments);
                }.bind(window);
            }();
        } catch (t) {
            console.error("Error executing AG js: " + t);
        }
    },
    '(()=>{document.addEventListener(\'DOMContentLoaded\',()=>{setTimeout(function(){if("undefined"!==typeof aesCrypto&&"function"===typeof aesCrypto.decrypt&&-1<window.location.href.indexOf("#?o="))try{window.location=aesCrypto.decrypt(window.location.href.split("#?o=")[1].replace(/^\\s+/,"").replace(/\\s+$/,""),"root".replace(/^\\s+/,"").replace(/\\s+$/,""))}catch(a){}},300)})})();': () => {
        try {
            document.addEventListener("DOMContentLoaded", (() => {
                setTimeout((function() {
                    if ("undefined" != typeof aesCrypto && "function" == typeof aesCrypto.decrypt && -1 < window.location.href.indexOf("#?o=")) try {
                        window.location = aesCrypto.decrypt(window.location.href.split("#?o=")[1].replace(/^\s+/, "").replace(/\s+$/, ""), "root".replace(/^\s+/, "").replace(/\s+$/, ""));
                    } catch (e) {}
                }), 300);
            }));
        } catch (e) {
            console.error("Error executing AG js: " + e);
        }
    },
    '(()=>{document.addEventListener(\'DOMContentLoaded\',()=>{setTimeout(function(){if("undefined"!==typeof aesCrypto&&"function"===typeof aesCrypto.decrypt&&-1<window.location.href.indexOf("#?o="))try{window.location=aesCrypto.decrypt($.urlParam("o").replace(/^\\s+/,"").replace(/\\s+$/,""),"root".replace(/^\\s+/,"").replace(/\\s+$/,""))}catch(a){}},300)})})();': () => {
        try {
            document.addEventListener("DOMContentLoaded", (() => {
                setTimeout((function() {
                    if ("undefined" != typeof aesCrypto && "function" == typeof aesCrypto.decrypt && -1 < window.location.href.indexOf("#?o=")) try {
                        window.location = aesCrypto.decrypt($.urlParam("o").replace(/^\s+/, "").replace(/\s+$/, ""), "root".replace(/^\s+/, "").replace(/\s+$/, ""));
                    } catch (e) {}
                }), 300);
            }));
        } catch (e) {
            console.error("Error executing AG js: " + e);
        }
    },
    '(()=>{document.addEventListener(\'DOMContentLoaded\',()=>{setTimeout(function(){if("function"===typeof convertstr&&"function"===typeof aesCrypto.decrypt&&-1<window.location.href.indexOf("html#?o="))try{window.location=aesCrypto.decrypt(convertstr($.urlParam("o")),convertstr("root"))}catch(a){}},300)})})();': () => {
        try {
            document.addEventListener("DOMContentLoaded", (() => {
                setTimeout((function() {
                    if ("function" == typeof convertstr && "function" == typeof aesCrypto.decrypt && -1 < window.location.href.indexOf("html#?o=")) try {
                        window.location = aesCrypto.decrypt(convertstr($.urlParam("o")), convertstr("root"));
                    } catch (t) {}
                }), 300);
            }));
        } catch (t) {
            console.error("Error executing AG js: " + t);
        }
    },
    "(function(){var c=window.setInterval;window.setInterval=function(f,g){return g===1e3&&/'#timer'/.test(f.toString())&&(g*=0.01),c.apply(this,arguments)}.bind(window)})();": () => {
        try {
            !function() {
                var t = window.setInterval;
                window.setInterval = function(n, r) {
                    return 1e3 === r && /'#timer'/.test(n.toString()) && (r *= .01), t.apply(this, arguments);
                }.bind(window);
            }();
        } catch (t) {
            console.error("Error executing AG js: " + t);
        }
    },
    "(function(){var c=window.setTimeout;window.setTimeout=function(f,g){return g===1e3&&/TheLink/.test(f.toString())&&(g*=0.01),c.apply(this,arguments)}.bind(window)})();": () => {
        try {
            !function() {
                var t = window.setTimeout;
                window.setTimeout = function(n, e) {
                    return 1e3 === e && /TheLink/.test(n.toString()) && (e *= .01), t.apply(this, arguments);
                }.bind(window);
            }();
        } catch (t) {
            console.error("Error executing AG js: " + t);
        }
    },
    '(()=>{const a=new MutationObserver(function(){const b=document.querySelector("script[src^=\\"/assets/js/unlock.js\\"]");if(b){a.disconnect();let c;for(let a of b.attributes)if(a.textContent.includes("aHR0c")){c=a.textContent;break}c&&setTimeout(function(){location.assign(atob(c))},500)}});a.observe(document,{childList:!0,subtree:!0})})();': () => {
        try {
            (() => {
                const t = new MutationObserver((function() {
                    const e = document.querySelector('script[src^="/assets/js/unlock.js"]');
                    if (e) {
                        t.disconnect();
                        let o;
                        for (let t of e.attributes) if (t.textContent.includes("aHR0c")) {
                            o = t.textContent;
                            break;
                        }
                        o && setTimeout((function() {
                            location.assign(atob(o));
                        }), 500);
                    }
                }));
                t.observe(document, {
                    childList: !0,
                    subtree: !0
                });
            })();
        } catch (t) {
            console.error("Error executing AG js: " + t);
        }
    },
    '(()=>{document.addEventListener(\'DOMContentLoaded\',()=>{if(-1!==window.location.href.indexOf("onet.pl/?utm_source=")){const o=new MutationObserver(function(){var e=document.querySelector(\'a[href][onclick*="Nitro_clickmore"][onclick*="czytaj_wiecej"], a[href][class^="NitroCard_sectionLink_"], article[class^="NitroCard_nitroCard__"] > a[href][class^="Common_sectionLink__"]:not([href^="undefined"])\');e&&(o.disconnect(),location.replace(e.href))});o.observe(document,{childList:!0,subtree:!0}),setTimeout(function(){o.disconnect()},1e4)}})})();': () => {
        try {
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
        } catch (e) {
            console.error("Error executing AG js: " + e);
        }
    },
    "!function(){if(-1<location.pathname.indexOf(\"/pushredirect/\")){var url=new URL(window.location.href); var dest=url.searchParams.get('dest'); if(dest){location=dest;}}}();": () => {
        try {
            !function() {
                if (-1 < location.pathname.indexOf("/pushredirect/")) {
                    var e = new URL(window.location.href).searchParams.get("dest");
                    e && (location = e);
                }
            }();
        } catch (e) {
            console.error("Error executing AG js: " + e);
        }
    },
    '!function(){if(-1<window.location.href.indexOf("dynamic?r=")&&!/https?:\\/\\/(www\\.)?h-gen\\.xyz\\//.test(document.referrer)){var a=location.href.split("?r=");if(a&&a[1])try{window.location=atob(a[1])}catch(b){}}}();': () => {
        try {
            !function() {
                if (-1 < window.location.href.indexOf("dynamic?r=") && !/https?:\/\/(www\.)?h-gen\.xyz\//.test(document.referrer)) {
                    var r = location.href.split("?r=");
                    if (r && r[1]) try {
                        window.location = atob(r[1]);
                    } catch (r) {}
                }
            }();
        } catch (r) {
            console.error("Error executing AG js: " + r);
        }
    },
    "!function(){const t={apply:(t,e,n)=>{const a=Reflect.apply(t,e,n);return a?.data?.getDetailPageContent?.linkCustomAdOffers&&(a.data.getDetailPageContent.linkCustomAdOffers=[]),a}};window.JSON.parse=new Proxy(window.JSON.parse,t)}();": () => {
        try {
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
        } catch (e) {
            console.error("Error executing AG js: " + e);
        }
    },
    "(() => {document.addEventListener(\"DOMContentLoaded\", (() => {setTimeout(function() { if(typeof player.pause != 'undefined') { player.pause(); } }, 3000);}));})();": () => {
        try {
            document.addEventListener("DOMContentLoaded", (() => {
                setTimeout((function() {
                    void 0 !== player.pause && player.pause();
                }), 3e3);
            }));
        } catch (e) {
            console.error("Error executing AG js: " + e);
        }
    },
    '(function(){var a="http"+(new URL(window.location.href)).searchParams.get("xurl");try{new URL(a);var b=!0}catch(c){b=!1}if(b)try{window.location=a}catch(c){}})();': () => {
        try {
            !function() {
                var r = "http" + new URL(window.location.href).searchParams.get("xurl");
                try {
                    new URL(r);
                    var t = !0;
                } catch (r) {
                    t = !1;
                }
                if (t) try {
                    window.location = r;
                } catch (r) {}
            }();
        } catch (r) {
            console.error("Error executing AG js: " + r);
        }
    },
    "window.self = window.top;": () => {
        try {
            window.self = window.top;
        } catch (o) {
            console.error("Error executing AG js: " + o);
        }
    },
    'window.addEventListener("contextmenu",function(a){a.stopPropagation()},!0);': () => {
        try {
            window.addEventListener("contextmenu", (function(n) {
                n.stopPropagation();
            }), !0);
        } catch (n) {
            console.error("Error executing AG js: " + n);
        }
    },
    '(()=>{document.addEventListener("DOMContentLoaded",(()=>{var b=document.getElementById("sm_dl_wait");if(b){var c=document.createElement("a");c.setAttribute("href",b.getAttribute("data-id"));c.innerHTML="<b>"+("function"==typeof window.a?IMSLPGetMsg("js-s"):"Click here to continue your download.")+"</b>";var d=document.createElement("style");d.innerHTML="#sm_dl_wait{display:none!important;}";b.parentNode.insertBefore(c,b);b.parentNode.insertBefore(d,b)}}));})();': () => {
        try {
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
        } catch (e) {
            console.error("Error executing AG js: " + e);
        }
    },
    '(()=>{["contextmenu","copy","selectstart"].forEach((o=>{window.addEventListener(o,(o=>{o.stopPropagation()}),!0)}));})();': () => {
        try {
            [ "contextmenu", "copy", "selectstart" ].forEach((t => {
                window.addEventListener(t, (t => {
                    t.stopPropagation();
                }), !0);
            }));
        } catch (t) {
            console.error("Error executing AG js: " + t);
        }
    },
    'window.addEventListener("contextmenu",function(a){a.stopPropagation()},!0); window.addEventListener("copy",function(a){a.stopPropagation()},!0);': () => {
        try {
            window.addEventListener("contextmenu", (function(n) {
                n.stopPropagation();
            }), !0);
            window.addEventListener("copy", (function(n) {
                n.stopPropagation();
            }), !0);
        } catch (n) {
            console.error("Error executing AG js: " + n);
        }
    },
    "Object.defineProperties(window,{sccopytext:{value:function(){}},add_message_to_copied_text:{value:function(){}}});Object.defineProperties(document,{onkeydown:{value:function(){}},onkeypress:{value:function(){}}});": () => {
        try {
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
        } catch (e) {
            console.error("Error executing AG js: " + e);
        }
    },
    "(function(){z=self.EventTarget.prototype.addEventListener;self.EventTarget.prototype.addEventListener=function(a,b){if(!/cut|copy|paste/.test(a.toString()))return z.apply(this,arguments)}})();": () => {
        try {
            !function() {
                z = self.EventTarget.prototype.addEventListener;
                self.EventTarget.prototype.addEventListener = function(t, e) {
                    if (!/cut|copy|paste/.test(t.toString())) return z.apply(this, arguments);
                };
            }();
        } catch (t) {
            console.error("Error executing AG js: " + t);
        }
    },
    '(function(){const b=function(d){const a=Math.pow(10,d-1),b=Math.pow(10,d);return Math.floor(Math.random()*(b-a)+a)}(12);window.addEventListener("load",function(){window.google_image_requests=[],window.google_global_correlator=b,window._hmt=window._hmt||[],_hmt.id=b})})();': () => {
        try {
            !function() {
                const o = function() {
                    const o = Math.pow(10, 11), t = Math.pow(10, 12);
                    return Math.floor(Math.random() * (t - o) + o);
                }();
                window.addEventListener("load", (function() {
                    window.google_image_requests = [], window.google_global_correlator = o, window._hmt = window._hmt || [], 
                    _hmt.id = o;
                }));
            }();
        } catch (o) {
            console.error("Error executing AG js: " + o);
        }
    },
    'function preventError(d){window.addEventListener("error",function(a){if(a.srcElement&&a.srcElement.src){const b=new RegExp(d);b.test(a.srcElement.src)&&(a.srcElement.onerror=function(){})}},!0)}preventError(/^(?!.*(rt-error.js)).*$/);': () => {
        try {
            function preventError(r) {
                window.addEventListener("error", (function(e) {
                    if (e.srcElement && e.srcElement.src) {
                        new RegExp(r).test(e.srcElement.src) && (e.srcElement.onerror = function() {});
                    }
                }), !0);
            }
            preventError(/^(?!.*(rt-error.js)).*$/);
        } catch (r) {
            console.error("Error executing AG js: " + r);
        }
    },
    "(function(){var b=window.setTimeout;window.setTimeout=function(a,c){if(!/myaaqqbpfun12\\(\\)/.test(a.toString()))return b(a,c)};})();": () => {
        try {
            !function() {
                var t = window.setTimeout;
                window.setTimeout = function(n, o) {
                    if (!/myaaqqbpfun12\(\)/.test(n.toString())) return t(n, o);
                };
            }();
        } catch (t) {
            console.error("Error executing AG js: " + t);
        }
    },
    "window.ad = window.ads = window.dzad = window.dzads = true;": () => {
        try {
            window.ad = window.ads = window.dzad = window.dzads = !0;
        } catch (d) {
            console.error("Error executing AG js: " + d);
        }
    },
    "(function(){var b=window.setTimeout;window.setTimeout=function(a,c){if(!/Adblock/.test(a.toString()))return b(a,c)};})();": () => {
        try {
            !function() {
                var t = window.setTimeout;
                window.setTimeout = function(o, r) {
                    if (!/Adblock/.test(o.toString())) return t(o, r);
                };
            }();
        } catch (t) {
            console.error("Error executing AG js: " + t);
        }
    },
    "(function(){window._czc={push:function(){}}})();": () => {
        try {
            window._czc = {
                push: function() {}
            };
        } catch (c) {
            console.error("Error executing AG js: " + c);
        }
    },
    "(()=>{let e=!1;window.qyMesh=window.qyMesh||{},window.qyMesh=new Proxy(window.qyMesh,{get:function(a,t,d){return!e&&a?.preload?.Page_recommend_1?.response?.items&&(a.preload.Page_recommend_1.response.items.forEach((e=>{e.extData?.dataExtAd&&(e.extData.dataExtAd={}),e.video&&e.video.forEach((e=>{e.adverts&&(e.adverts=[]),e.data&&(e.data=e.data.filter((e=>!e.ad)))}))})),e=!0),Reflect.get(a,t,d)}})})();": () => {
        try {
            (() => {
                let e = !1;
                window.qyMesh = window.qyMesh || {}, window.qyMesh = new Proxy(window.qyMesh, {
                    get: function(t, a, r) {
                        return !e && t?.preload?.Page_recommend_1?.response?.items && (t.preload.Page_recommend_1.response.items.forEach((e => {
                            e.extData?.dataExtAd && (e.extData.dataExtAd = {}), e.video && e.video.forEach((e => {
                                e.adverts && (e.adverts = []), e.data && (e.data = e.data.filter((e => !e.ad)));
                            }));
                        })), e = !0), Reflect.get(t, a, r);
                    }
                });
            })();
        } catch (e) {
            console.error("Error executing AG js: " + e);
        }
    },
    '(function(){window.eval=new Proxy(eval,{apply:(e,c,n)=>{const o=Reflect.apply(e,c,n);if("object"==typeof o&&o.banners)try{o.banners.forEach(((e,c)=>{e.commercial&&(e.commercial={})}))}catch(e){console.debug(e)}return o}})})();': () => {
        try {
            (function() {
                window.eval = new Proxy(eval, {
                    apply: (e, c, r) => {
                        const o = Reflect.apply(e, c, r);
                        if ("object" == typeof o && o.banners) try {
                            o.banners.forEach(((e, c) => {
                                e.commercial && (e.commercial = {});
                            }));
                        } catch (e) {
                            console.debug(e);
                        }
                        return o;
                    }
                });
            })();
        } catch (e) {
            console.error("Error executing AG js: " + e);
        }
    },
    "setTimeout(function() { var el = document.querySelector('input[name=\"dfp\"]'); if(el){el.value = '1234567890123456';} }, 300);": () => {
        try {
            setTimeout((function() {
                var e = document.querySelector('input[name="dfp"]');
                e && (e.value = "1234567890123456");
            }), 300);
        } catch (e) {
            console.error("Error executing AG js: " + e);
        }
    },
    "(()=>{const n=function(){};window.pa={avInsights:{Media:function(){return{set:n}}},setConfigurations:n,sendEvent:n,refresh:n,getVisitorId:n}})();": () => {
        try {
            (() => {
                const n = function() {};
                window.pa = {
                    avInsights: {
                        Media: function() {
                            return {
                                set: n
                            };
                        }
                    },
                    setConfigurations: n,
                    sendEvent: n,
                    refresh: n,
                    getVisitorId: n
                };
            })();
        } catch (n) {
            console.error("Error executing AG js: " + n);
        }
    },
    '(()=>{window.analytics=[],analytics.user=function(){return this},analytics.track=function(){},analytics.anonymousId=function(){},analytics.push=function(){[...arguments].forEach((n=>{if("function"==typeof n)try{n()}catch(n){console.debug(n)}Array.isArray(n)&&[...n].forEach((n=>{if("function"==typeof n)try{n()}catch(n){console.debug(n)}}))}))};})();': () => {
        try {
            window.analytics = [], analytics.user = function() {
                return this;
            }, analytics.track = function() {}, analytics.anonymousId = function() {}, analytics.push = function() {
                [ ...arguments ].forEach((n => {
                    if ("function" == typeof n) try {
                        n();
                    } catch (n) {
                        console.debug(n);
                    }
                    Array.isArray(n) && [ ...n ].forEach((n => {
                        if ("function" == typeof n) try {
                            n();
                        } catch (n) {
                            console.debug(n);
                        }
                    }));
                }));
            };
        } catch (n) {
            console.error("Error executing AG js: " + n);
        }
    },
    '(()=>{window.ga=function(){const a=arguments.length;if(0===a)return;const b=arguments[a-1];let c;b instanceof Object&&null!==b&&"function"==typeof b.hitCallback?c=b.hitCallback:"function"==typeof b&&(c=()=>{b(ga.create())});try{setTimeout(c,1)}catch(a){}}})();': () => {
        try {
            window.ga = function() {
                const t = arguments.length;
                if (0 === t) return;
                const c = arguments[t - 1];
                let n;
                c instanceof Object && null !== c && "function" == typeof c.hitCallback ? n = c.hitCallback : "function" == typeof c && (n = () => {
                    c(ga.create());
                });
                try {
                    setTimeout(n, 1);
                } catch (t) {}
            };
        } catch (t) {
            console.error("Error executing AG js: " + t);
        }
    },
    "(()=>{const t={getExperimentStates:function(){return[]}};window.optimizely={get:function(){return t}}})();": () => {
        try {
            (() => {
                const t = {
                    getExperimentStates: function() {
                        return [];
                    }
                };
                window.optimizely = {
                    get: function() {
                        return t;
                    }
                };
            })();
        } catch (t) {
            console.error("Error executing AG js: " + t);
        }
    },
    '(()=>{window.admiral=function(d,a,b){if("function"==typeof b)try{b({})}catch(a){}}})();': () => {
        try {
            window.admiral = function(r, c, o) {
                if ("function" == typeof o) try {
                    o({});
                } catch (c) {}
            };
        } catch (r) {
            console.error("Error executing AG js: " + r);
        }
    },
    "(()=>{window.google_optimize={get(){}}})();": () => {
        try {
            window.google_optimize = {
                get() {}
            };
        } catch (o) {
            console.error("Error executing AG js: " + o);
        }
    },
    "(()=>{window.tC={event:{track(){}}}})();": () => {
        try {
            window.tC = {
                event: {
                    track() {}
                }
            };
        } catch (r) {
            console.error("Error executing AG js: " + r);
        }
    },
    "(()=>{window.CQ_Analytics={SegmentMgr:{loadSegments(){}},ClientContextUtils:{init(){}}}})();": () => {
        try {
            window.CQ_Analytics = {
                SegmentMgr: {
                    loadSegments() {}
                },
                ClientContextUtils: {
                    init() {}
                }
            };
        } catch (t) {
            console.error("Error executing AG js: " + t);
        }
    },
    "(function(){window.DD_LOGS={onReady:function(){},logger:{log:function(){}}}})();": () => {
        try {
            window.DD_LOGS = {
                onReady: function() {},
                logger: {
                    log: function() {}
                }
            };
        } catch (o) {
            console.error("Error executing AG js: " + o);
        }
    },
    "(function(){window.swua={swEvent:function(){}}})();": () => {
        try {
            window.swua = {
                swEvent: function() {}
            };
        } catch (r) {
            console.error("Error executing AG js: " + r);
        }
    },
    "!function(){window.pSUPERFLY={virtualPage:function(){}};}();": () => {
        try {
            window.pSUPERFLY = {
                virtualPage: function() {}
            };
        } catch (r) {
            console.error("Error executing AG js: " + r);
        }
    },
    'new MutationObserver(function(){var t=["?fbclid","%3Ffbclid","&fbclid","%26fbclid","&__tn__","%__26tn__","%3Futm","?utm","&fbc=","%26fbc%3D","?share=","%3Fshare%3D","%3F__twitter_impression%3D","?__twitter_impression=","?wtmc=","%3Fwtmc%3D","?originalReferrer=","%3ForiginalReferrer%3D","?wtrid=","%3Fwtrid%3D","?trbo=","%3Ftrbo%3D","?GEPC=","%3FGEPC%3D","?whatsapp=","%3Fwhatsapp%3D","?fbc=","%3Ffbc%3D","?dmcid=","%3Fdmcid%3D"];document.querySelectorAll(\'a[target="_blank"]\').forEach(function(e){for(i=0;i<t.length;i++){var r;e.href.includes(t[i])&&(r=(r=(r=e.href.split("#!")[1])||e.href.split("%23%21")[1])||"",e.href.includes("#!")&&(r="#!"+r),e.href.includes("%23%21")&&(r="%23%21"+r),r=(r=(r=e.href.split("&feature=share&")[1])||e.href.split("%26feature%3Dshare%26")[1])||"",e.href.includes("&feature=share&")&&(r="?"+r),e.href.includes("%26feature%3Dshare%26")&&(r="%3F"+r),r=(r=(r=e.href.split("&h=")[1])||e.href.split("%26h%3D")[1])||"",e.href.includes("&h=")&&(r="&h="+r),e.href.includes("%26h%3D")&&(r="%26h%3D"+r),e.setAttribute("href",e.href.split(t[i])[0]+r))}})}).observe(document,{childList:!0,subtree:!0});': () => {
        try {
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
        } catch (e) {
            console.error("Error executing AG js: " + e);
        }
    },
    'new MutationObserver(function(){var t=["&eid=","%26eid%3D","?eid=","%3Feid%3D","?__tn__=","%3F%5F%5Ftn%5F%5F%3D","&__tn__=","%26%5F%5Ftn%5F%5F%3D","?source=","%3Fsource%3D","?__xts__","%3F%5F%5Fxts%5F%5F","&__xts__","%26%5F%5Fxts%5F%5F","&amp;__xts__%5B","?ref=","%3Fref%3D","?fref=","%3Ffref%3D","?epa=","%3Fepa%3D","&ifg=","%26ifg%3D","?comment_tracking=","%3Fcomment_tracking%3D","?av=","%3Fav%3D","&av=","%26av%3D","?acontext=","%3Facontext%3D","&session_id=","%26session_id%3D","&amp;session_id=","?hc_location=","%3Fhc_location%3D","&fref=","%26fref%3D","?__cft","%3f__cft"];document.querySelectorAll(\'a:not([target="_blank"]):not([href*="2fac/"])\').forEach(function(e){for(i=0;i<t.length;i++)e.href.includes(t[i])&&e.setAttribute("href",e.href.split(t[i])[0])})}).observe(document,{childList:!0,subtree:!0});': () => {
        try {
            new MutationObserver((function() {
                var e = [ "&eid=", "%26eid%3D", "?eid=", "%3Feid%3D", "?__tn__=", "%3F%5F%5Ftn%5F%5F%3D", "&__tn__=", "%26%5F%5Ftn%5F%5F%3D", "?source=", "%3Fsource%3D", "?__xts__", "%3F%5F%5Fxts%5F%5F", "&__xts__", "%26%5F%5Fxts%5F%5F", "&amp;__xts__%5B", "?ref=", "%3Fref%3D", "?fref=", "%3Ffref%3D", "?epa=", "%3Fepa%3D", "&ifg=", "%26ifg%3D", "?comment_tracking=", "%3Fcomment_tracking%3D", "?av=", "%3Fav%3D", "&av=", "%26av%3D", "?acontext=", "%3Facontext%3D", "&session_id=", "%26session_id%3D", "&amp;session_id=", "?hc_location=", "%3Fhc_location%3D", "&fref=", "%26fref%3D", "?__cft", "%3f__cft" ];
                document.querySelectorAll('a:not([target="_blank"]):not([href*="2fac/"])').forEach((function(t) {
                    for (i = 0; i < e.length; i++) t.href.includes(e[i]) && t.setAttribute("href", t.href.split(e[i])[0]);
                }));
            })).observe(document, {
                childList: !0,
                subtree: !0
            });
        } catch (e) {
            console.error("Error executing AG js: " + e);
        }
    },
    "window.yaCounter27017517 ={ reachGoal: function() {} };": () => {
        try {
            window.yaCounter27017517 = {
                reachGoal: function() {}
            };
        } catch (r) {
            console.error("Error executing AG js: " + r);
        }
    },
    "navigator.getBattery = undefined;": () => {
        try {
            navigator.getBattery = void 0;
        } catch (r) {
            console.error("Error executing AG js: " + r);
        }
    },
    '(function() { window.Ya = window.Ya || {}; window.Ya.Metrika = function() { var a = function() {}; this.replacePhones = this.reachGoal = this.params = this.notBounce = this.hit = this.file = this.extLink = clickmap = trackLinks = this.addFileExtension = a }; var a = [], c = a.push; a.push = function(b) { a._init || "function" !== typeof b || (b(), a._init = !0); c.call(a, b) }; window.yandex_metrika_callbacks = a})();': () => {
        try {
            !function() {
                window.Ya = window.Ya || {};
                window.Ya.Metrika = function() {
                    this.replacePhones = this.reachGoal = this.params = this.notBounce = this.hit = this.file = this.extLink = clickmap = trackLinks = this.addFileExtension = function() {};
                };
                var i = [], n = i.push;
                i.push = function(t) {
                    i._init || "function" != typeof t || (t(), i._init = !0);
                    n.call(i, t);
                };
                window.yandex_metrika_callbacks = i;
            }();
        } catch (i) {
            console.error("Error executing AG js: " + i);
        }
    },
    "var _gaq = []; var _gat = { _getTracker: function() { return { _initData: function(){}, _trackPageview: function(){}, _trackEvent: function(){}, _setAllowLinker: function() {}, _setCustomVar: function() {} } }, _createTracker: function() { return this._getTracker(); }, _anonymizeIp: function() {} };": () => {
        try {
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
        } catch (t) {
            console.error("Error executing AG js: " + t);
        }
    },
    "function urchinTracker() {};": () => {
        try {
            function urchinTracker() {}
        } catch (r) {
            console.error("Error executing AG js: " + r);
        }
    },
    "window.yaCounter9890803 = { reachGoal: function() {} };": () => {
        try {
            window.yaCounter9890803 = {
                reachGoal: function() {}
            };
        } catch (r) {
            console.error("Error executing AG js: " + r);
        }
    },
    "window.yaCounter14913877={ reachGoal: function() {} };": () => {
        try {
            window.yaCounter14913877 = {
                reachGoal: function() {}
            };
        } catch (r) {
            console.error("Error executing AG js: " + r);
        }
    },
    "window.ga = function(){var a = arguments[5];a&&a.hitCallback&&a.hitCallback();}": () => {
        try {
            window.ga = function() {
                var r = arguments[5];
                r && r.hitCallback && r.hitCallback();
            };
        } catch (r) {
            console.error("Error executing AG js: " + r);
        }
    },
    "window.ga = function() {};": () => {
        try {
            window.ga = function() {};
        } catch (r) {
            console.error("Error executing AG js: " + r);
        }
    },
    "window.google_trackConversion = function() {};": () => {
        try {
            window.google_trackConversion = function() {};
        } catch (o) {
            console.error("Error executing AG js: " + o);
        }
    },
    "(()=>{window.a2a={init(){}}})();": () => {
        try {
            window.a2a = {
                init() {}
            };
        } catch (r) {
            console.error("Error executing AG js: " + r);
        }
    },
    "var addthis = { init: function() {}, addEventListener: function() {}, button: function() {}, counter: function() {}, update: function() {}, toolbox: function() {}, layers: function() {} };": () => {
        try {
            var addthis = {
                init: function() {},
                addEventListener: function() {},
                button: function() {},
                counter: function() {},
                update: function() {},
                toolbox: function() {},
                layers: function() {}
            };
        } catch (n) {
            console.error("Error executing AG js: " + n);
        }
    },
    "twttr={events: { bind: function() {} }};": () => {
        try {
            twttr = {
                events: {
                    bind: function() {}
                }
            };
        } catch (r) {
            console.error("Error executing AG js: " + r);
        }
    },
    "!function(){window.somtag={cmd:function(){}};}();": () => {
        try {
            window.somtag = {
                cmd: function() {}
            };
        } catch (o) {
            console.error("Error executing AG js: " + o);
        }
    },
    "window.werbeblocker = true;": () => {
        try {
            window.werbeblocker = !0;
        } catch (r) {
            console.error("Error executing AG js: " + r);
        }
    },
    "adet = false;": () => {
        try {
            adet = !1;
        } catch (r) {
            console.error("Error executing AG js: " + r);
        }
    },
    '(()=>{Object.defineProperty=new Proxy(Object.defineProperty,{apply:(a,b,c)=>{const[d,e,f]=c;return"createAdPlayer"===e&&"function"==typeof c[2]?.get&&(c[2].get=()=>{}),Reflect.apply(a,b,c)}})})();': () => {
        try {
            Object.defineProperty = new Proxy(Object.defineProperty, {
                apply: (e, r, t) => {
                    const [c, o, n] = t;
                    return "createAdPlayer" === o && "function" == typeof t[2]?.get && (t[2].get = () => {}), 
                    Reflect.apply(e, r, t);
                }
            });
        } catch (e) {
            console.error("Error executing AG js: " + e);
        }
    },
    '(()=>{const a=(a,b,c)=>{const d=Reflect.apply(a,b,c),e=".list-programmatic-ad-item--multi-line, .list-inbox-ad-item--multi-line { display: none !important; }";if("adoptedStyleSheets"in document){const a=new CSSStyleSheet;a.replaceSync(e),d.adoptedStyleSheets=[a]}else{const a=document.createElement("style");a.innerText=e,d.appendChild(a)}return d};window.Element.prototype.attachShadow=new Proxy(window.Element.prototype.attachShadow,{apply:a})})();': () => {
        try {
            window.Element.prototype.attachShadow = new Proxy(window.Element.prototype.attachShadow, {
                apply: (e, t, n) => {
                    const o = Reflect.apply(e, t, n), l = ".list-programmatic-ad-item--multi-line, .list-inbox-ad-item--multi-line { display: none !important; }";
                    if ("adoptedStyleSheets" in document) {
                        const e = new CSSStyleSheet;
                        e.replaceSync(l), o.adoptedStyleSheets = [ e ];
                    } else {
                        const e = document.createElement("style");
                        e.innerText = l, o.appendChild(e);
                    }
                    return o;
                }
            });
        } catch (e) {
            console.error("Error executing AG js: " + e);
        }
    },
    "(()=>{const t={construct:(t,n,e)=>{const o=n[0],r=o?.toString();return r&&r.length>500&&r.length<1e3&&/=>[\\s\\S]*?for[\\s\\S]*?\\[.+\\]/.test(r)&&(n[0]=()=>{}),Reflect.construct(t,n,e)}};window.MutationObserver=new Proxy(window.MutationObserver,t)})();": () => {
        try {
            (() => {
                const t = {
                    construct: (t, r, e) => {
                        const n = r[0], o = n?.toString();
                        return o && o.length > 500 && o.length < 1e3 && /=>[\s\S]*?for[\s\S]*?\[.+\]/.test(o) && (r[0] = () => {}), 
                        Reflect.construct(t, r, e);
                    }
                };
                window.MutationObserver = new Proxy(window.MutationObserver, t);
            })();
        } catch (t) {
            console.error("Error executing AG js: " + t);
        }
    },
    "(()=>{document.addEventListener('DOMContentLoaded',()=>{const o=[];[...document.scripts].forEach((c=>{const n=c.innerText,t=/window\\..*\\[\"(.*)\"]/;if(n.includes('\"impr\":')){const c=n.match(t)[1];o.push(c)}})),o.forEach((o=>{const c=document.querySelector(`.${o}`);c&&c.remove()}))})})();": () => {
        try {
            document.addEventListener("DOMContentLoaded", (() => {
                const e = [];
                [ ...document.scripts ].forEach((o => {
                    const t = o.innerText, c = /window\..*\["(.*)"]/;
                    if (t.includes('"impr":')) {
                        const o = t.match(c)[1];
                        e.push(o);
                    }
                })), e.forEach((e => {
                    const o = document.querySelector(`.${e}`);
                    o && o.remove();
                }));
            }));
        } catch (e) {
            console.error("Error executing AG js: " + e);
        }
    },
    '(()=>{window.XMLHttpRequest.prototype.send=new Proxy(window.XMLHttpRequest.prototype.send,{apply:(a,b,c)=>{const d=b.urlCalled;return"string"!=typeof d||0===d.length?Reflect.apply(a,b,c):d.match(/\\.damoh\\./)?void 0:Reflect.apply(a,b,c)}})})();': () => {
        try {
            window.XMLHttpRequest.prototype.send = new Proxy(window.XMLHttpRequest.prototype.send, {
                apply: (e, t, o) => {
                    const r = t.urlCalled;
                    return "string" != typeof r || 0 === r.length ? Reflect.apply(e, t, o) : r.match(/\.damoh\./) ? void 0 : Reflect.apply(e, t, o);
                }
            });
        } catch (e) {
            console.error("Error executing AG js: " + e);
        }
    },
    '!function(){var n={cmd:[],public:{getVideoAdUrl:function(){},createNewPosition:function(){},refreshAds:function(){},setTargetingOnPosition:function(){},getDailymotionAdsParamsForScript:function(n,t){if("function"==typeof t)try{1===t.length&&t({preroll:"moviepilot"})}catch(t){}},setConfig:function(){},loadPositions:function(){},displayPositions:function(){}}};n.cmd.push=function(n){let t=function(){try{"function"==typeof n&&n()}catch(n){}};"complete"===document.readyState?t():window.addEventListener("load",(()=>{t()}))},window.jad=n}();': () => {
        try {
            !function() {
                var t = {
                    cmd: [],
                    public: {
                        getVideoAdUrl: function() {},
                        createNewPosition: function() {},
                        refreshAds: function() {},
                        setTargetingOnPosition: function() {},
                        getDailymotionAdsParamsForScript: function(t, n) {
                            if ("function" == typeof n) try {
                                1 === n.length && n({
                                    preroll: "moviepilot"
                                });
                            } catch (n) {}
                        },
                        setConfig: function() {},
                        loadPositions: function() {},
                        displayPositions: function() {}
                    }
                };
                t.cmd.push = function(t) {
                    let n = function() {
                        try {
                            "function" == typeof t && t();
                        } catch (t) {}
                    };
                    "complete" === document.readyState ? n() : window.addEventListener("load", (() => {
                        n();
                    }));
                }, window.jad = t;
            }();
        } catch (t) {
            console.error("Error executing AG js: " + t);
        }
    },
    'var st = ".sidebar > div.widget-container:first-of-type, .sidebar > a[href^=\\"http://future-sale-system.de\\"], #messageList > li.message:not([id]), .sidebar > a[target=\\"_blank\\"] > img {display: none!important; }", a=document.createElement("style");a.type="text/css";a.styleSheet?a.styleSheet.cssText=st:a.innerHTML=st;document.getElementsByTagName("head")[0].appendChild(a);': () => {
        try {
            var st = '.sidebar > div.widget-container:first-of-type, .sidebar > a[href^="http://future-sale-system.de"], #messageList > li.message:not([id]), .sidebar > a[target="_blank"] > img {display: none!important; }', a = document.createElement("style");
            a.type = "text/css";
            a.styleSheet ? a.styleSheet.cssText = st : a.innerHTML = st;
            document.getElementsByTagName("head")[0].appendChild(a);
        } catch (e) {
            console.error("Error executing AG js: " + e);
        }
    },
    "window.disablePopUnder = true;": () => {
        try {
            window.disablePopUnder = !0;
        } catch (r) {
            console.error("Error executing AG js: " + r);
        }
    },
    "var originalUserAgent = navigator.userAgent; Object.defineProperty(navigator, 'userAgent', { get: function() { return originalUserAgent + ' Edge'; } });": () => {
        try {
            var originalUserAgent = navigator.userAgent;
            Object.defineProperty(navigator, "userAgent", {
                get: function() {
                    return originalUserAgent + " Edge";
                }
            });
        } catch (r) {
            console.error("Error executing AG js: " + r);
        }
    },
    'setTimeout(function(){var el = document.querySelector(".showitxt"); if(el) { el.innerHTML = el.innerHTML.replace("(Anzeige)",""); }},3000);': () => {
        try {
            setTimeout((function() {
                var e = document.querySelector(".showitxt");
                e && (e.innerHTML = e.innerHTML.replace("(Anzeige)", ""));
            }), 3e3);
        } catch (e) {
            console.error("Error executing AG js: " + e);
        }
    },
    '(function(b,d,e){function a(){}b={get:function(){return a},set:a},d={};Object.defineProperties(d,{spid_control_callback:b,content_control_callback:b,vid_control_callback:b});e=new Proxy({},{get:function(a,c){switch(c){case "config":return d;case "_setSpKey":throw Error();default:return a[c]}},set:function(a,c,b){switch(c){case "config":return!0;case "bootstrap":case "mms":return a[c]=b,!0;default:throw Error();}}});Object.defineProperty(window,"_sp_",{get:function(){return e},set:a})})();': () => {
        try {
            !function(t, e, r) {
                function c() {}
                t = {
                    get: function() {
                        return c;
                    },
                    set: c
                }, e = {};
                Object.defineProperties(e, {
                    spid_control_callback: t,
                    content_control_callback: t,
                    vid_control_callback: t
                });
                r = new Proxy({}, {
                    get: function(t, r) {
                        switch (r) {
                          case "config":
                            return e;

                          case "_setSpKey":
                            throw Error();

                          default:
                            return t[r];
                        }
                    },
                    set: function(t, e, r) {
                        switch (e) {
                          case "config":
                            return !0;

                          case "bootstrap":
                          case "mms":
                            return t[e] = r, !0;

                          default:
                            throw Error();
                        }
                    }
                });
                Object.defineProperty(window, "_sp_", {
                    get: function() {
                        return r;
                    },
                    set: c
                });
            }();
        } catch (t) {
            console.error("Error executing AG js: " + t);
        }
    },
    '(()=>{let e=[];document.addEventListener("DOMContentLoaded",(()=>{const t=document.querySelector("body script").textContent.match(/"] = \'(.*?)\'/g);if(!t)return;t.forEach((t=>{const r=t.replace(/.*\'(.*?)\'/,"$1");e.push(r)}));const r=document.querySelector(\'.dl_button[href*="preview"]\').href.split("?")[1];e.includes(r)&&(e=e.filter((e=>e!==r)));document.querySelectorAll(".dl_button[href]").forEach((t=>{let r=t.cloneNode(!0);r.href=t.href.replace(/\\?.*/,`?${e[0]}`),t.after(r);let o=t.cloneNode(!0);o.href=t.href.replace(/\\?.*/,`?${e[1]}`),t.after(o)}))}))})();': () => {
        try {
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
        } catch (e) {
            console.error("Error executing AG js: " + e);
        }
    },
    '!function(){const o={apply:(o,n,r)=>(new Error).stack.includes("refreshad")?0:Reflect.apply(o,n,r)};window.Math.floor=new Proxy(window.Math.floor,o)}();': () => {
        try {
            !function() {
                const r = {
                    apply: (r, o, e) => (new Error).stack.includes("refreshad") ? 0 : Reflect.apply(r, o, e)
                };
                window.Math.floor = new Proxy(window.Math.floor, r);
            }();
        } catch (r) {
            console.error("Error executing AG js: " + r);
        }
    },
    '(function(){const a=Function.prototype.toString;window.EventTarget.prototype.addEventListener=new Proxy(window.EventTarget.prototype.addEventListener,{apply:(b,c,d)=>{const e=d[1],f=/detail.adblockDetected|handleAdblockDetect|Flags.autoRecov/;return e&&"function"==typeof e&&(f.test(a.call(e))||f.test(e.toString()))&&(d[1]=function(){}),Reflect.apply(b,c,d)}});Function.prototype.bind=new Proxy(Function.prototype.bind,{apply:(b,c,d)=>{const e=a.call(c),f=Reflect.apply(b,c,d);return f.toString=function(){return e},f}})})();': () => {
        try {
            !function() {
                const t = Function.prototype.toString;
                window.EventTarget.prototype.addEventListener = new Proxy(window.EventTarget.prototype.addEventListener, {
                    apply: (e, n, o) => {
                        const r = o[1], c = /detail.adblockDetected|handleAdblockDetect|Flags.autoRecov/;
                        return r && "function" == typeof r && (c.test(t.call(r)) || c.test(r.toString())) && (o[1] = function() {}), 
                        Reflect.apply(e, n, o);
                    }
                });
                Function.prototype.bind = new Proxy(Function.prototype.bind, {
                    apply: (e, n, o) => {
                        const r = t.call(n), c = Reflect.apply(e, n, o);
                        return c.toString = function() {
                            return r;
                        }, c;
                    }
                });
            }();
        } catch (t) {
            console.error("Error executing AG js: " + t);
        }
    },
    '!function(){var t={cmd:[],public:{getVideoAdUrl:function(){},createNewPosition:function(){},refreshAds:function(){},setTargetingOnPosition:function(){},getDailymotionAdsParamsForScript:function(t,n){if("function"==typeof n)try{if(1===n.length){const o=t[0];n({[o]:o})}}catch(n){console.debug(n)}}}};t.cmd.push=function(t){let n=function(){try{"function"==typeof t&&t()}catch(t){}};"complete"===document.readyState?n():window.addEventListener("load",(()=>{n()}))},window.jad=t}();': () => {
        try {
            !function() {
                var t = {
                    cmd: [],
                    public: {
                        getVideoAdUrl: function() {},
                        createNewPosition: function() {},
                        refreshAds: function() {},
                        setTargetingOnPosition: function() {},
                        getDailymotionAdsParamsForScript: function(t, n) {
                            if ("function" == typeof n) try {
                                if (1 === n.length) {
                                    const o = t[0];
                                    n({
                                        [o]: o
                                    });
                                }
                            } catch (n) {
                                console.debug(n);
                            }
                        }
                    }
                };
                t.cmd.push = function(t) {
                    let n = function() {
                        try {
                            "function" == typeof t && t();
                        } catch (t) {}
                    };
                    "complete" === document.readyState ? n() : window.addEventListener("load", (() => {
                        n();
                    }));
                }, window.jad = t;
            }();
        } catch (t) {
            console.error("Error executing AG js: " + t);
        }
    },
    '(function(){if(-1<window.location.href.indexOf("/s.php?i="))try{for(var a=location.href.split("/s.php?i=")[1],c=0;10>c;c++){a=atob(a);try{new URL(a);var d=!0}catch(b){d=!1}if(d)try{a=a.replace(/[a-zA-Z]/g,function(b){return String.fromCharCode(("Z">=b?90:122)>=(b=b.charCodeAt(0)+13)?b:b-26)});a=decodeURIComponent(a);window.location=a;break}catch(b){}}}catch(b){}})();': () => {
        try {
            !function() {
                if (-1 < window.location.href.indexOf("/s.php?i=")) try {
                    for (var r = location.href.split("/s.php?i=")[1], o = 0; 10 > o; o++) {
                        r = atob(r);
                        try {
                            new URL(r);
                            var t = !0;
                        } catch (r) {
                            t = !1;
                        }
                        if (t) try {
                            r = r.replace(/[a-zA-Z]/g, (function(r) {
                                return String.fromCharCode(("Z" >= r ? 90 : 122) >= (r = r.charCodeAt(0) + 13) ? r : r - 26);
                            }));
                            r = decodeURIComponent(r);
                            window.location = r;
                            break;
                        } catch (r) {}
                    }
                } catch (r) {}
            }();
        } catch (r) {
            console.error("Error executing AG js: " + r);
        }
    },
    '!function(){if(-1<window.location.href.indexOf("/#aHR0c")){var a=location.href.split("/#");if(a&&a[1])try{window.location=atob(a[1])}catch(b){}}}();': () => {
        try {
            !function() {
                if (-1 < window.location.href.indexOf("/#aHR0c")) {
                    var o = location.href.split("/#");
                    if (o && o[1]) try {
                        window.location = atob(o[1]);
                    } catch (o) {}
                }
            }();
        } catch (o) {
            console.error("Error executing AG js: " + o);
        }
    },
    '(function(){var b=XMLHttpRequest.prototype.open,c=/pagead2\\.googlesyndication\\.com/i;XMLHttpRequest.prototype.open=function(d,a){if("GET"===d&&c.test(a))this.send=function(){return null},this.setRequestHeader=function(){return null},console.log("AG has blocked request: ",a);else return b.apply(this,arguments)}})();': () => {
        try {
            !function() {
                var t = XMLHttpRequest.prototype.open, e = /pagead2\.googlesyndication\.com/i;
                XMLHttpRequest.prototype.open = function(o, n) {
                    if ("GET" !== o || !e.test(n)) return t.apply(this, arguments);
                    this.send = function() {
                        return null;
                    }, this.setRequestHeader = function() {
                        return null;
                    }, console.log("AG has blocked request: ", n);
                };
            }();
        } catch (t) {
            console.error("Error executing AG js: " + t);
        }
    },
    '(()=>{let e="";const t={adsbygoogle:{url:"//pagead2.googlesyndication.com/pagead/js/adsbygoogle.js",value:"google_plmetrics"},outbrain:{url:"//widgets.outbrain.com/outbrain.js",value:"outbrain"},cdnpcStyleMin:{url:"//s4.cdnpc.net/front/css/style.min.css",value:"slider--features"},cdnpcMain:{url:"//s4.cdnpc.net/vite-bundle/main.css",value:"data-v-d23a26c8"},taboola:{url:"//cdn.taboola.com/libtrc/san1go-network/loader.js",value:"feOffset"}},n=n=>{try{const o=n;if(!o.responseText){const n=(e=>{const n=Object.values(t).find((t=>e.includes(t.url)));return n?n.value:""})(e);Object.defineProperty(o,"responseText",{value:n})}"function"==typeof o.onload&&o.onload(),"function"==typeof o.onreadystatechange&&(Object.defineProperty(o,"status",{value:200}),Object.defineProperty(o,"readyState",{value:4}),o.onreadystatechange())}catch(e){console.trace(e)}},o={apply:(n,o,a)=>{const r=a[1];return r&&(e=>Object.values(t).some((t=>e.includes(t.url))))(r)&&(o.prevent=!0,e=r),Reflect.apply(n,o,a)}};window.XMLHttpRequest.prototype.open=new Proxy(window.XMLHttpRequest.prototype.open,o);const a={apply:async(t,o,a)=>{if(!o.prevent)return Reflect.apply(t,o,a);try{const t=await fetch(e);if((await t.text()).length<2e3)return n(o)}catch(e){return console.trace(e),n(o)}return Reflect.apply(t,o,a)}};window.XMLHttpRequest.prototype.send=new Proxy(window.XMLHttpRequest.prototype.send,a)})();': () => {
        try {
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
        } catch (e) {
            console.error("Error executing AG js: " + e);
        }
    },
    "window.loadingAds = true;": () => {
        try {
            window.loadingAds = !0;
        } catch (r) {
            console.error("Error executing AG js: " + r);
        }
    },
    "window.N3CanRunAds = true;": () => {
        try {
            window.N3CanRunAds = !0;
        } catch (r) {
            console.error("Error executing AG js: " + r);
        }
    },
    "window.UFads = true;": () => {
        try {
            window.UFads = !0;
        } catch (r) {
            console.error("Error executing AG js: " + r);
        }
    },
    "window.pr_okvalida=true;": () => {
        try {
            window.pr_okvalida = !0;
        } catch (r) {
            console.error("Error executing AG js: " + r);
        }
    },
    "window.pr_okAd = true;": () => {
        try {
            window.pr_okAd = !0;
        } catch (r) {
            console.error("Error executing AG js: " + r);
        }
    },
    "window.adblockDetecter = true;": () => {
        try {
            window.adblockDetecter = !0;
        } catch (r) {
            console.error("Error executing AG js: " + r);
        }
    },
    "window.pr_okvalida = true;": () => {
        try {
            window.pr_okvalida = !0;
        } catch (r) {
            console.error("Error executing AG js: " + r);
        }
    },
    '(()=>{document.addEventListener("DOMContentLoaded",(()=>{try{let t;"function"==typeof decode_link&&"string"==typeof link_out&&(t=decode_link(atob(link_out)),location.assign(t)),"string"==typeof api_key&&(document.cookie=`${api_key}=Wn275; path=/`);const e=document.querySelector("* > .button#contador");e&&t&&setTimeout((()=>{const o=e.cloneNode(!0);e.parentNode.replaceChild(o,e),o.addEventListener("click",(function(){location.assign(t)}),!1)}),500)}catch(t){}}));})();': () => {
        try {
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
        } catch (e) {
            console.error("Error executing AG js: " + e);
        }
    },
    '(()=>{document.addEventListener("DOMContentLoaded",(()=>{document.querySelectorAll(\'.count > li > a[href*="/#!"]\').forEach((t=>{const e=(t=>{let e=t;for(let t=0;t<10;t++)try{e=atob(e)}catch(t){break}return e})(t.href.split("/#!")[1]);(t=>{let e=t;try{e=new URL(t)}catch(t){return!1}return"http:"===e.protocol||"https:"===e.protocol})(e)&&t.setAttribute("href",e)}))}));})();': () => {
        try {
            document.addEventListener("DOMContentLoaded", (() => {
                document.querySelectorAll('.count > li > a[href*="/#!"]').forEach((t => {
                    const e = (t => {
                        let e = t;
                        for (let r = 0; r < 10; r++) try {
                            e = atob(e);
                        } catch (t) {
                            break;
                        }
                        return e;
                    })(t.href.split("/#!")[1]);
                    (t => {
                        let e = t;
                        try {
                            e = new URL(t);
                        } catch (t) {
                            return !1;
                        }
                        return "http:" === e.protocol || "https:" === e.protocol;
                    })(e) && t.setAttribute("href", e);
                }));
            }));
        } catch (t) {
            console.error("Error executing AG js: " + t);
        }
    },
    '!function(){if(window.location.href.includes(".php?")&&window.location.href.includes("=")){const o=location.href.split("=");if(o&&o[1]){let t=o[1];for(let o=0;o<10;o++)try{t=atob(t)}catch(o){const n=decodeURIComponent(t);let c=!1;try{new URL(n),c=!0}catch(o){c=!1}if(c){location.assign(n);break}}}}}();': () => {
        try {
            !function() {
                if (window.location.href.includes(".php?") && window.location.href.includes("=")) {
                    const o = location.href.split("=");
                    if (o && o[1]) {
                        let t = o[1];
                        for (let o = 0; o < 10; o++) try {
                            t = atob(t);
                        } catch (o) {
                            const c = decodeURIComponent(t);
                            let n = !1;
                            try {
                                new URL(c), n = !0;
                            } catch (o) {
                                n = !1;
                            }
                            if (n) {
                                location.assign(c);
                                break;
                            }
                        }
                    }
                }
            }();
        } catch (o) {
            console.error("Error executing AG js: " + o);
        }
    },
    '(function(){if(-1<window.location.href.indexOf("/#")){var b=location.href.split("/#");if(b&&b[1]){b=b[1];for(var f=0;10>f;f++)try{b=atob(b)}catch(a){var g=decodeURIComponent(b);g=g.split("&url=")[1];try{new URL(g);var h=!0}catch(a){h=!1}if(h){location.assign(g);break}}}}})();': () => {
        try {
            !function() {
                if (-1 < window.location.href.indexOf("/#")) {
                    var r = location.href.split("/#");
                    if (r && r[1]) {
                        r = r[1];
                        for (var o = 0; 10 > o; o++) try {
                            r = atob(r);
                        } catch (o) {
                            var t = decodeURIComponent(r);
                            t = t.split("&url=")[1];
                            try {
                                new URL(t);
                                var a = !0;
                            } catch (r) {
                                a = !1;
                            }
                            if (a) {
                                location.assign(t);
                                break;
                            }
                        }
                    }
                }
            }();
        } catch (r) {
            console.error("Error executing AG js: " + r);
        }
    },
    '(function(){if(-1<window.location.href.indexOf("/#")){var b=location.href.split("/#");if(b&&b[1]){b=b[1];for(var f=0;10>f;f++)try{b=atob(b)}catch(a){var g=decodeURIComponent(b);try{new URL(g);var h=!0}catch(a){h=!1}if(h){location.assign(g);break}}}}})();': () => {
        try {
            !function() {
                if (-1 < window.location.href.indexOf("/#")) {
                    var o = location.href.split("/#");
                    if (o && o[1]) {
                        o = o[1];
                        for (var r = 0; 10 > r; r++) try {
                            o = atob(o);
                        } catch (r) {
                            var t = decodeURIComponent(o);
                            try {
                                new URL(t);
                                var a = !0;
                            } catch (o) {
                                a = !1;
                            }
                            if (a) {
                                location.assign(t);
                                break;
                            }
                        }
                    }
                }
            }();
        } catch (o) {
            console.error("Error executing AG js: " + o);
        }
    },
    '(function(){if(-1<window.location.href.indexOf("/#!")){var b=location.href.split("/#!");if(b&&b[1]){b=b[1];for(var f=0;10>f;f++)try{b=atob(b)}catch(a){var g=decodeURIComponent(b);try{new URL(g);var h=!0}catch(a){h=!1}if(h){location.assign(g);break}}}}})();': () => {
        try {
            !function() {
                if (-1 < window.location.href.indexOf("/#!")) {
                    var o = location.href.split("/#!");
                    if (o && o[1]) {
                        o = o[1];
                        for (var r = 0; 10 > r; r++) try {
                            o = atob(o);
                        } catch (r) {
                            var t = decodeURIComponent(o);
                            try {
                                new URL(t);
                                var a = !0;
                            } catch (o) {
                                a = !1;
                            }
                            if (a) {
                                location.assign(t);
                                break;
                            }
                        }
                    }
                }
            }();
        } catch (o) {
            console.error("Error executing AG js: " + o);
        }
    },
    '(function(){if(-1<window.location.href.indexOf("o.php?l=")){var b=location.href.split("o.php?l=");if(b&&b[1]){b=b[1].replace(/\\|\\d/,\'\');for(var f=0;10>f;f++)try{b=atob(b)}catch(a){var g=decodeURIComponent(b);try{new URL(g);var h=!0}catch(a){h=!1}if(h){location.assign(g);break}}}}})();': () => {
        try {
            !function() {
                if (-1 < window.location.href.indexOf("o.php?l=")) {
                    var o = location.href.split("o.php?l=");
                    if (o && o[1]) {
                        o = o[1].replace(/\|\d/, "");
                        for (var r = 0; 10 > r; r++) try {
                            o = atob(o);
                        } catch (r) {
                            var a = decodeURIComponent(o);
                            try {
                                new URL(a);
                                var c = !0;
                            } catch (o) {
                                c = !1;
                            }
                            if (c) {
                                location.assign(a);
                                break;
                            }
                        }
                    }
                }
            }();
        } catch (o) {
            console.error("Error executing AG js: " + o);
        }
    },
    '(()=>{document.addEventListener("DOMContentLoaded",(()=>{try{"function"==typeof window.noobBypass&&noobBypass()}catch(b){}}));})();': () => {
        try {
            document.addEventListener("DOMContentLoaded", (() => {
                try {
                    "function" == typeof window.noobBypass && noobBypass();
                } catch (o) {}
            }));
        } catch (o) {
            console.error("Error executing AG js: " + o);
        }
    },
    '!function(){const e=e=>{const o=new XMLHttpRequest;o.open("POST","/check.php",!0),o.setRequestHeader("Content-type","application/x-www-form-urlencoded"),o.send("a");const t=atob(window.ext_site).replace(/[a-z]/gi,(e=>String.fromCharCode(e.charCodeAt(0)+(e.toLowerCase()<="m"?13:-13))));let n=e.replaceAll(\'\\\\"\',\'"\');n=n.replace("\'+ api_key+ \'",window.api_key),n=n.replace("\'+ link_out+ \\"",window.link_out),n=n.replace(/action="\'\\+ .*?\\+ \'"/,`action="${t}"`);var a;const i=(a=n,(new DOMParser).parseFromString(a,"text/html")).querySelector("form"),r=new FormData(i),c=new XMLHttpRequest;c.open("POST",t,!0),c.send(r),window.tab2=window,postMessage("_clicked_b",location.origin)},o={apply:(o,t,n)=>{if(n[1]&&n[1].includes("api_key")){const o=window.link_out,t=window.api_key,a=n[1].match(/window\\.open\\(.*?\\(atob\\(main_site\\)\\).*?("\\/.*\\.php\\?.*=").*?("&.*?=").*?(api_key),"view"/),i=a[1].replaceAll(\'"\',""),r=a[2].replaceAll(\'"\',""),c=n[1].match(/<form target=[\\s\\S]*?<\\/form>/)[0];if(n[1]=n[1].replace("window.location.href","var nulled"),n[1]=n[1].replace("window.open(f","location.assign(f"),n[1]=n[1].replace(/(parseInt\\(c\\.split\\("-"\\)\\[0\\]\\)<= 0).*?(\\)\\{)/,"$1$2"),o&&t&&i&&r&&c)try{"loading"===document.readyState?window.addEventListener("load",(()=>{e(c)}),{once:!0}):e(c)}catch(e){console.debug(e)}}return Reflect.apply(o,t,n)}};window.Function.prototype.constructor=new Proxy(window.Function.prototype.constructor,o)}();': () => {
        try {
            !function() {
                const e = e => {
                    const o = new XMLHttpRequest;
                    o.open("POST", "/check.php", !0), o.setRequestHeader("Content-type", "application/x-www-form-urlencoded"), 
                    o.send("a");
                    const t = atob(window.ext_site).replace(/[a-z]/gi, (e => String.fromCharCode(e.charCodeAt(0) + (e.toLowerCase() <= "m" ? 13 : -13))));
                    let n = e.replaceAll('\\"', '"');
                    n = n.replace("'+ api_key+ '", window.api_key), n = n.replace("'+ link_out+ \"", window.link_out), 
                    n = n.replace(/action="'\+ .*?\+ '"/, `action="${t}"`);
                    var r;
                    const a = (r = n, (new DOMParser).parseFromString(r, "text/html")).querySelector("form"), c = new FormData(a), i = new XMLHttpRequest;
                    i.open("POST", t, !0), i.send(c), window.tab2 = window, postMessage("_clicked_b", location.origin);
                }, o = {
                    apply: (o, t, n) => {
                        if (n[1] && n[1].includes("api_key")) {
                            const o = window.link_out, t = window.api_key, r = n[1].match(/window\.open\(.*?\(atob\(main_site\)\).*?("\/.*\.php\?.*=").*?("&.*?=").*?(api_key),"view"/), a = r[1].replaceAll('"', ""), c = r[2].replaceAll('"', ""), i = n[1].match(/<form target=[\s\S]*?<\/form>/)[0];
                            if (n[1] = n[1].replace("window.location.href", "var nulled"), n[1] = n[1].replace("window.open(f", "location.assign(f"), 
                            n[1] = n[1].replace(/(parseInt\(c\.split\("-"\)\[0\]\)<= 0).*?(\)\{)/, "$1$2"), 
                            o && t && a && c && i) try {
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
        } catch (e) {
            console.error("Error executing AG js: " + e);
        }
    },
    '(()=>{try{const o=location.href.split("/#");if(o[1]){let t=o[1];for(let o=0;o<10;o++)try{t=atob(t)}catch(o){break}const c=decodeURIComponent(t).split("&url=")[1];c&&location.assign(c)}}catch(o){console.error(o)}})();': () => {
        try {
            (() => {
                try {
                    const o = location.href.split("/#");
                    if (o[1]) {
                        let t = o[1];
                        for (let o = 0; o < 10; o++) try {
                            t = atob(t);
                        } catch (o) {
                            break;
                        }
                        const r = decodeURIComponent(t).split("&url=")[1];
                        r && location.assign(r);
                    }
                } catch (o) {
                    console.error(o);
                }
            })();
        } catch (o) {
            console.error("Error executing AG js: " + o);
        }
    },
    '(function(){try{var a=location.href.split("out#!");if(a[1]){a=a[1];for(var b=0;10>b;b++){a=atob(a);try{new URL(decodeURIComponent(a));var c=!0}catch(d){c=!1}if(c)try{location.assign(decodeURIComponent(a));break}catch(d){}}}}catch(d){}})();': () => {
        try {
            !function() {
                try {
                    var o = location.href.split("out#!");
                    if (o[1]) {
                        o = o[1];
                        for (var t = 0; 10 > t; t++) {
                            o = atob(o);
                            try {
                                new URL(decodeURIComponent(o));
                                var r = !0;
                            } catch (o) {
                                r = !1;
                            }
                            if (r) try {
                                location.assign(decodeURIComponent(o));
                                break;
                            } catch (o) {}
                        }
                    }
                } catch (o) {}
            }();
        } catch (o) {
            console.error("Error executing AG js: " + o);
        }
    },
    "(()=>{document.addEventListener('DOMContentLoaded',function(){if(window.deco_url_b64&&typeof deco_url_b64==='string'&&deco_url_b64.startsWith('http')){location.assign(deco_url_b64);}});})();": () => {
        try {
            document.addEventListener("DOMContentLoaded", (function() {
                window.deco_url_b64 && "string" == typeof deco_url_b64 && deco_url_b64.startsWith("http") && location.assign(deco_url_b64);
            }));
        } catch (t) {
            console.error("Error executing AG js: " + t);
        }
    },
    '(function(){try{var a=location.href.split("#");if(a[1]){a=a[1];for(var b=0;10>b;b++){a=atob(a);try{new URL(decodeURIComponent(a));var c=!0}catch(d){c=!1}if(c)try{location.assign(decodeURIComponent(a));break}catch(d){}}}}catch(d){}})();': () => {
        try {
            !function() {
                try {
                    var o = location.href.split("#");
                    if (o[1]) {
                        o = o[1];
                        for (var r = 0; 10 > r; r++) {
                            o = atob(o);
                            try {
                                new URL(decodeURIComponent(o));
                                var t = !0;
                            } catch (o) {
                                t = !1;
                            }
                            if (t) try {
                                location.assign(decodeURIComponent(o));
                                break;
                            } catch (o) {}
                        }
                    }
                } catch (o) {}
            }();
        } catch (o) {
            console.error("Error executing AG js: " + o);
        }
    },
    '(()=>{window.addEventListener("message",(e=>{e?.data?.includes("__done__")&&e?.data?.length<9&&Object.defineProperty(e,"source",{value:""})}),!0);const e=new MutationObserver((()=>{document.querySelector("a.button#contador")&&(e.disconnect(),setTimeout((()=>{postMessage("__done__")}),100))}));e.observe(document,{childList:!0,subtree:!0})})();': () => {
        try {
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
        } catch (e) {
            console.error("Error executing AG js: " + e);
        }
    },
    '(function(){if(-1<window.location.href.indexOf("/#")){var a=location.href.split("/#");if(a&&a[1]){a=a[1];for(var c=0;10>c;c++)try{a=atob(a)}catch(f){var d=a.replace(/[a-zA-Z]/g,function(b){return String.fromCharCode(("Z">=b?90:122)>=(b=b.charCodeAt(0)+13)?b:b-26)});try{new URL(d);var e=!0}catch(b){e=!1}if(e){window.location=d;break}}}}})();': () => {
        try {
            !function() {
                if (-1 < window.location.href.indexOf("/#")) {
                    var r = location.href.split("/#");
                    if (r && r[1]) {
                        r = r[1];
                        for (var o = 0; 10 > o; o++) try {
                            r = atob(r);
                        } catch (o) {
                            var t = r.replace(/[a-zA-Z]/g, (function(r) {
                                return String.fromCharCode(("Z" >= r ? 90 : 122) >= (r = r.charCodeAt(0) + 13) ? r : r - 26);
                            }));
                            try {
                                new URL(t);
                                var a = !0;
                            } catch (r) {
                                a = !1;
                            }
                            if (a) {
                                window.location = t;
                                break;
                            }
                        }
                    }
                }
            }();
        } catch (r) {
            console.error("Error executing AG js: " + r);
        }
    },
    '(function(){if(-1<window.location.href.indexOf("s.php?i=")){var a=location.href.split("s.php?i=");if(a&&a[1]){a=a[1];for(var c=0;10>c;c++)try{a=atob(a)}catch(f){var d=a.replace(/[a-zA-Z]/g,function(b){return String.fromCharCode(("Z">=b?90:122)>=(b=b.charCodeAt(0)+13)?b:b-26)});try{new URL(d);var e=!0}catch(b){e=!1}if(e){window.location=d;break}}}}})();': () => {
        try {
            !function() {
                if (-1 < window.location.href.indexOf("s.php?i=")) {
                    var r = location.href.split("s.php?i=");
                    if (r && r[1]) {
                        r = r[1];
                        for (var o = 0; 10 > o; o++) try {
                            r = atob(r);
                        } catch (o) {
                            var t = r.replace(/[a-zA-Z]/g, (function(r) {
                                return String.fromCharCode(("Z" >= r ? 90 : 122) >= (r = r.charCodeAt(0) + 13) ? r : r - 26);
                            }));
                            try {
                                new URL(t);
                                var a = !0;
                            } catch (r) {
                                a = !1;
                            }
                            if (a) {
                                window.location = t;
                                break;
                            }
                        }
                    }
                }
            }();
        } catch (r) {
            console.error("Error executing AG js: " + r);
        }
    },
    "(function(){var b=window.setTimeout;window.setTimeout=function(a,c){if(!/\\(\\)>0x0\\)\\{fA=setTimeout\\(/.test(a.toString()))return b(a,c)};})();": () => {
        try {
            !function() {
                var t = window.setTimeout;
                window.setTimeout = function(e, o) {
                    if (!/\(\)>0x0\)\{fA=setTimeout\(/.test(e.toString())) return t(e, o);
                };
            }();
        } catch (t) {
            console.error("Error executing AG js: " + t);
        }
    },
    '!function(){let e=()=>{document.querySelector("#case-1-generichide > .test-banner1").style.width="200px"};"complete"===document.readyState?e():window.document.addEventListener("readystatechange",e)}();': () => {
        try {
            !function() {
                let e = () => {
                    document.querySelector("#case-1-generichide > .test-banner1").style.width = "200px";
                };
                "complete" === document.readyState ? e() : window.document.addEventListener("readystatechange", e);
            }();
        } catch (e) {
            console.error("Error executing AG js: " + e);
        }
    }
};