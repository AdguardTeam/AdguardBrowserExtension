import { LRUMap } from 'lru_map';

/**
 * Used for new type of redirects, i.e. click2load.html
 */
export const redirectsCache = (function () {
    const cache = new LRUMap(100);

    const add = (url) => cache.set(url, true);

    const hasUrl = (url) => cache.has(url);

    return {
        add,
        hasUrl,
    };
})();
