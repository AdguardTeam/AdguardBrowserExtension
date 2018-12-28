adguard.scriptlet = (function () {
    const exports = {};

    /**
     * Wrap function into IIFE
     * @param {Function} func function to wrap in IIFE
     * @param  {...any} args function arguments
     */
    function wrapInIIFE(func, ...args) {
        return '"use strict";(' + func + ')(' + args.map(JSON.stringify).join(',') + ')';
    }

    /**
     * Add dependencies code
     * @param {string} injectable injectable string code
     * @param  {...any} dependencies dependcies for code
     */
    function resolveDependecies(injectable, dependcies) {
        dependcies.forEach(dep => injectable += dep);
        return injectable;
    }

    /**
     * 
     * @param {} injectable 
     * @param  {...any} deps 
     */
    function inject(injectable, ...deps) {
        return (args) => resolveDependecies(wrapInIIFE(injectable, args), deps); 
    }

    /**
     * 
     * @param {*} args 
     */
    function abortOnPropertyRead(args) {
        console.log('abortOnPropertyRead');
    };
    exports['abort-on-property-read'] = inject(abortOnPropertyRead);


    function scriptlet(source, args) {
        if (!source.name) {
            return;
        }
        if (!exports[source.name]) {
            return;
        }

        // todo make platform check
        // todo add hit()
        // todo add version

        return exports[source.name](args);
    };

    return scriptlet;
})();