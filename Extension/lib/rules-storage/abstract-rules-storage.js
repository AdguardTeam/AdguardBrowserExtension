// TODO move into helpers
const errorFunction = () => {
    throw new Error('Seems like webpack didn\'t inject proper rules storage implementation');
};

const noop = () => {};

export const rulesStorageImpl = (() => {
    return {
        /**
         * Required
         */
        read: errorFunction,

        /**
         * Required
         */
        write: errorFunction,

        /**
         * Required
         */
        remove: errorFunction,

        /**
         * Optional
         */
        init: noop,

        /**
         * Optional
         */
        isIndexedDB: noop,
    };
})();
