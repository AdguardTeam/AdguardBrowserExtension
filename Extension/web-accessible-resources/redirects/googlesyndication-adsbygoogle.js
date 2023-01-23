(function(source, args) {
    function GoogleSyndicationAdsByGoogle(source) {
        window.adsbygoogle = {
            loaded: true,
            push(arg) {
                if (typeof this.length === "undefined") {
                    this.length = 0;
                    this.length += 1;
                }
                if (arg !== null && arg instanceof Object && arg.constructor.name === "Object") {
                    for (var _i = 0, _Object$keys = Object.keys(arg); _i < _Object$keys.length; _i++) {
                        const key = _Object$keys[_i];
                        if (typeof arg[key] === "function") {
                            try {
                                arg[key].call(this, {});
                            } catch (_unused) {}
                        }
                    }
                }
            }
        };
        const adElems = document.querySelectorAll(".adsbygoogle");
        const css = "height:1px!important;max-height:1px!important;max-width:1px!important;width:1px!important;";
        const statusAttrName = "data-adsbygoogle-status";
        const ASWIFT_IFRAME_MARKER = "aswift_";
        const GOOGLE_ADS_IFRAME_MARKER = "google_ads_iframe_";
        let executed = false;
        for (let i = 0; i < adElems.length; i += 1) {
            const adElemChildNodes = adElems[i].childNodes;
            const childNodesQuantity = adElemChildNodes.length;
            let areIframesDefined = false;
            if (childNodesQuantity > 0) {
                areIframesDefined = childNodesQuantity === 2 && adElemChildNodes[0].nodeName.toLowerCase() === "iframe" && adElemChildNodes[0].id.indexOf(ASWIFT_IFRAME_MARKER) > -1 && adElemChildNodes[1].nodeName.toLowerCase() === "iframe" && adElemChildNodes[1].id.indexOf(GOOGLE_ADS_IFRAME_MARKER) > -1;
            }
            if (!areIframesDefined) {
                adElems[i].setAttribute(statusAttrName, "done");
                const aswiftIframe = document.createElement("iframe");
                aswiftIframe.id = "".concat(ASWIFT_IFRAME_MARKER).concat(i);
                aswiftIframe.style = css;
                adElems[i].appendChild(aswiftIframe);
                const innerAswiftIframe = document.createElement("iframe");
                aswiftIframe.contentWindow.document.body.appendChild(innerAswiftIframe);
                const googleadsIframe = document.createElement("iframe");
                googleadsIframe.id = "".concat(GOOGLE_ADS_IFRAME_MARKER).concat(i);
                googleadsIframe.style = css;
                adElems[i].appendChild(googleadsIframe);
                const innerGoogleadsIframe = document.createElement("iframe");
                googleadsIframe.contentWindow.document.body.appendChild(innerGoogleadsIframe);
                executed = true;
            }
        }
        if (executed) {
            hit(source);
        }
    }
    function hit(source) {
        if (source.verbose !== true) {
            return;
        }
        try {
            const log = console.log.bind(console);
            const trace = console.trace.bind(console);
            let prefix = source.ruleText || "";
            if (source.domainName) {
                const AG_SCRIPTLET_MARKER = "#%#//";
                const UBO_SCRIPTLET_MARKER = "##+js";
                let ruleStartIndex;
                if (source.ruleText.indexOf(AG_SCRIPTLET_MARKER) > -1) {
                    ruleStartIndex = source.ruleText.indexOf(AG_SCRIPTLET_MARKER);
                } else if (source.ruleText.indexOf(UBO_SCRIPTLET_MARKER) > -1) {
                    ruleStartIndex = source.ruleText.indexOf(UBO_SCRIPTLET_MARKER);
                }
                const rulePart = source.ruleText.slice(ruleStartIndex);
                prefix = "".concat(source.domainName).concat(rulePart);
            }
            log("".concat(prefix, " trace start"));
            if (trace) {
                trace();
            }
            log("".concat(prefix, " trace end"));
        } catch (e) {}
        if (typeof window.__debug === "function") {
            window.__debug(source);
        }
    }
    const updatedArgs = args ? [].concat(source).concat(args) : [ source ];
    try {
        GoogleSyndicationAdsByGoogle.apply(this, updatedArgs);
    } catch (e) {
        console.log(e);
    }
})({
    name: "googlesyndication-adsbygoogle",
    args: []
}, []);