(function(source, args) {
    function ScoreCardResearchBeacon(source) {
        window.COMSCORE = {
            purge() {
                window._comscore = [];
            },
            beacon() {}
        };
        hit(source);
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
        ScoreCardResearchBeacon.apply(this, updatedArgs);
    } catch (e) {
        console.log(e);
    }
})({
    name: "scorecardresearch-beacon",
    args: []
}, []);