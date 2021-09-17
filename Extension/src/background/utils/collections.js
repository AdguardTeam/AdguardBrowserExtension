/**
 * Util class for work with collections
 */
export const collections = (() => {
    const CollectionUtils = {

        remove(collection, element) {
            if (!element || !collection) {
                return;
            }
            const index = collection.indexOf(element);
            if (index >= 0) {
                collection.splice(index, 1);
            }
        },

        removeAll(collection, element) {
            if (!element || !collection) {
                return;
            }
            for (let i = collection.length - 1; i >= 0; i -= 1) {
                if (collection[i] === element) {
                    collection.splice(i, 1);
                }
            }
        },

        removeRule(collection, rule) {
            if (!rule || !collection) {
                return;
            }
            for (let i = collection.length - 1; i >= 0; i -= 1) {
                if (rule.getText() === collection[i].getText()) {
                    collection.splice(i, 1);
                }
            }
        },

        removeDuplicates(arr) {
            if (!arr || arr.length === 1) {
                return arr;
            }
            return arr.filter((elem, pos) => arr.indexOf(elem) === pos);
        },

        getRulesText(collection) {
            const text = [];
            if (!collection) {
                return text;
            }
            for (let i = 0; i < collection.length; i += 1) {
                text.push(collection[i].getText());
            }
            return text;
        },

        /**
         * Find element in array by property
         * @param array
         * @param property
         * @param value
         * @returns {*}
         */
        find(array, property, value) {
            if (typeof array.find === 'function') {
                return array.find(a => a[property] === value);
            }
            for (let i = 0; i < array.length; i += 1) {
                const elem = array[i];
                if (elem[property] === value) {
                    return elem;
                }
            }
            return null;
        },

        /**
         * Checks if specified object is array
         * We don't use instanceof because it is too slow: http://jsperf.com/instanceof-performance/2
         * @param obj Object
         */
        isArray: Array.isArray || function (obj) {
            return `${obj}` === '[object Array]';
        },

        /**
         * Returns array elements of a, which is not included in b
         *
         * @param a
         * @param b
         */
        getArraySubtraction(a, b) {
            return a.filter(i => b.indexOf(i) < 0);
        },
    };

    return CollectionUtils;
})();
