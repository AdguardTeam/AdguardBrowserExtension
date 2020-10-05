/* eslint-disable prefer-rest-params */
/**
 * Util class for support timeout, retry operations, debounce
 */
export const concurrent = (function () {
    const ConcurrentUtils = {
        runAsync(callback, context) {
            const params = Array.prototype.slice.call(arguments, 2);
            setTimeout(() => {
                callback.apply(context, params);
            }, 0);
        },

        retryUntil(predicate, main, details) {
            if (typeof details !== 'object') {
                details = {};
            }

            let now = 0;
            const next = details.next || 200;
            const until = details.until || 2000;

            const check = function () {
                if (predicate() === true || now >= until) {
                    main();
                    return;
                }
                now += next;
                setTimeout(check, next);
            };

            setTimeout(check, 1);
        },

        debounce(func, wait) {
            let timeout;
            return function () {
                const context = this;
                const args = arguments;
                const later = function () {
                    timeout = null;
                    func.apply(context, args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        },

        /**
         * Returns a new function that, when invoked, invokes `func` at most once per `wait` milliseconds.
         * https://github.com/component/throttle
         *
         * @param {Function} func Function to wrap.
         * @param {Number} wait Number of milliseconds that must elapse between `func` invocations.
         * @return {Function} A new function that wraps the `func` function passed in.
         */
        throttle(func, wait) {
            let ctx;
            let args;
            let rtn;
            let
                timeoutID; // caching
            let last = 0;

            function call() {
                timeoutID = 0;
                last = +new Date();
                rtn = func.apply(ctx, args);
                ctx = null;
                args = null;
            }

            return function throttled() {
                ctx = this;
                args = arguments;
                const delta = new Date() - last;
                if (!timeoutID) {
                    if (delta >= wait) {
                        call();
                    } else {
                        timeoutID = setTimeout(call, wait - delta);
                    }
                }
                return rtn;
            };
        },
    };

    return ConcurrentUtils;
})();
