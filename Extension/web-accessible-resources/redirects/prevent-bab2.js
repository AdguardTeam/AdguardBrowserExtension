(function(source, args) {
    function preventBab2(source) {
        var script = document.currentScript;
        if (script === null) {
            return;
        }
        var url = script.src;
        if (typeof url !== "string") {
            return;
        }
        var domainsStr = [ "adclixx\\.net", "adnetasia\\.com", "adtrackers\\.net", "bannertrack\\.net" ].join("|");
        var matchStr = "^https?://[\\w-]+\\.(".concat(domainsStr, ")/.");
        var domainsRegex = new RegExp(matchStr);
        if (domainsRegex.test(url) === false) {
            return;
        }
        window.nH7eXzOsG = 858;
        hit(source);
    }
    function hit(source) {
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
                if (source.ruleText.includes(AG_SCRIPTLET_MARKER)) {
                    ruleStartIndex = source.ruleText.indexOf(AG_SCRIPTLET_MARKER);
                } else if (source.ruleText.includes(UBO_SCRIPTLET_MARKER)) {
                    ruleStartIndex = source.ruleText.indexOf(UBO_SCRIPTLET_MARKER);
                }
                var rulePart = source.ruleText.slice(ruleStartIndex);
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
        preventBab2.apply(this, updatedArgs);
    } catch (e) {
        console.log(e);
    }
})({
    name: "prevent-bab2",
    args: []
}, []);