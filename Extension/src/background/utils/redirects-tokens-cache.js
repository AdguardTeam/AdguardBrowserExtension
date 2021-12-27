import { LRUMap } from 'lru_map';
import { nanoid } from 'nanoid';

/**
 * Used for new type of redirects, i.e. click2load.html
 */
export const redirectsTokensCache = (function () {
    const cache = new LRUMap(1000);

    /**
     * Generates random unblock token for url and saves it to cache.
     * Used while redirect creating in createRedirectFileUrl()
     * @returns {string} token
     */
    const generateToken = () => {
        const token = nanoid();
        cache.set(token, true);
        return token;
    };

    /**
     * Checks whether token exist in cache.
     * Used while redirect checking in getBlockedResponseByRule()
     * @param {string} token
     * @returns {boolean}
     */
    const hasToken = (token) => cache.has(token);

    return {
        generateToken,
        hasToken,
    };
})();
