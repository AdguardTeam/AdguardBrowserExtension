import { Deferred, when } from 'simply-deferred';

/**
 * Promises wrapper
 */
export const Promise = (function () {
    const defer = Deferred;

    const deferAll = function (arr) {
        return when.apply(Deferred, arr);
    };

    const Promise = function () {
        const deferred = defer();
        let promise;
        if (typeof deferred.promise === 'function') {
            promise = deferred.promise();
        } else {
            promise = deferred.promise;
        }

        const resolve = function (arg) {
            deferred.resolve(arg);
        };

        const reject = function (arg) {
            deferred.reject(arg);
        };

        const then = function (onSuccess, onReject) {
            promise.then(onSuccess, onReject);
        };

        return {
            promise,
            resolve,
            reject,
            then,
        };
    };

    Promise.all = function (promises) {
        const defers = [];
        for (let i = 0; i < promises.length; i += 1) {
            defers.push(promises[i].promise);
        }
        return deferAll(defers);
    };

    return Promise;
})();
