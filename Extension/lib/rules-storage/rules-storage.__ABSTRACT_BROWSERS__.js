const errorFunction = () => {
    throw new Error('Seems like webpack didn\'t inject proper rules storage implementation');
};

const abstractRulesStorageImpl = (() => {
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
        init: errorFunction,

        /**
         * Optional
         */
        isIndexedDB: errorFunction,
    };
})();

export default abstractRulesStorageImpl;
