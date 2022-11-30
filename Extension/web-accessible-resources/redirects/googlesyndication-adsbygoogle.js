(function(source, args) {
    function GoogleSyndicationAdsByGoogle(source) {
        window.adsbygoogle = {
            loaded: true,
            push: function push(arg) {
                if (typeof this.length === "undefined") {
                    this.length = 0;
                    this.length += 1;
                }
                if (arg !== null && arg instanceof Object && arg.constructor.name === "Object") {
                    for (var _i = 0, _Object$keys = Object.keys(arg); _i < _Object$keys.length; _i++) {
                        var key = _Object$keys[_i];
                        if (typeof arg[key] === "function") {
                            try {
                                arg[key].call();
                            } catch (_unused) {}
                        }
                    }
                }
            }
        };
        var adElems = document.querySelectorAll(".adsbygoogle");
        var css = "height:1px!important;max-height:1px!important;max-width:1px!important;width:1px!important;";
        var statusAttrName = "data-adsbygoogle-status";
        var ASWIFT_IFRAME_MARKER = "aswift_";
        var GOOGLE_ADS_IFRAME_MARKER = "google_ads_iframe_";
        var executed = false;
        for (var i = 0; i < adElems.length; i += 1) {
            var adElemChildNodes = adElems[i].childNodes;
            var childNodesQuantity = adElemChildNodes.length;
            var areIframesDefined = false;
            if (childNodesQuantity > 0) {
                areIframesDefined = childNodesQuantity === 2 && adElemChildNodes[0].nodeName.toLowerCase() === "iframe" && adElemChildNodes[0].id.indexOf(ASWIFT_IFRAME_MARKER) > -1 && adElemChildNodes[1].nodeName.toLowerCase() === "iframe" && adElemChildNodes[1].id.indexOf(GOOGLE_ADS_IFRAME_MARKER) > -1;
            }
            if (!areIframesDefined) {
                adElems[i].setAttribute(statusAttrName, "done");
                var aswiftIframe = document.createElement("iframe");
                aswiftIframe.id = "".concat(ASWIFT_IFRAME_MARKER).concat(i);
                aswiftIframe.style = css;
                adElems[i].appendChild(aswiftIframe);
                var innerAswiftIframe = document.createElement("iframe");
                aswiftIframe.contentWindow.document.body.appendChild(innerAswiftIframe);
                var googleadsIframe = document.createElement("iframe");
                googleadsIframe.id = "".concat(GOOGLE_ADS_IFRAME_MARKER).concat(i);
                googleadsIframe.style = css;
                adElems[i].appendChild(googleadsIframe);
                var innerGoogleadsIframe = document.createElement("iframe");
                googleadsIframe.contentWindow.document.body.appendChild(innerGoogleadsIframe);
                executed = true;
            }
        }
        if (executed) {
            hit(source);
        }
    }
    function hit(source, message) {
        if (source.verbose !== true) {
            return;
        }
        try {
            var log = console.log.bind(console);
            var trace = console.trace.bind(console);
            var prefix = source.ruleText || "";
            if (source.domainName) {
                var AG_SCRIPTLET_MARKER = "#%#//";
                var UBO_SCRIPTLET_MARKER = "##+js";
                var ruleStartIndex;
                if (source.ruleText.indexOf(AG_SCRIPTLET_MARKER) > -1) {
                    ruleStartIndex = source.ruleText.indexOf(AG_SCRIPTLET_MARKER);
                } else if (source.ruleText.indexOf(UBO_SCRIPTLET_MARKER) > -1) {
                    ruleStartIndex = source.ruleText.indexOf(UBO_SCRIPTLET_MARKER);
                }
                var rulePart = source.ruleText.slice(ruleStartIndex);
                prefix = "".concat(source.domainName).concat(rulePart);
            }
            var LOG_MARKER = "log: ";
            if (message) {
                if (message.indexOf(LOG_MARKER) === -1) {
                    log("".concat(prefix, " message:\n").concat(message));
                } else {
                    log(message.slice(LOG_MARKER.length));
                }
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