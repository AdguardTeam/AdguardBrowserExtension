/**
 * This file is part of Adguard Browser Extension (https://github.com/AdguardTeam/AdguardBrowserExtension).
 *
 * Adguard Browser Extension is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Adguard Browser Extension is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with Adguard Browser Extension.  If not, see <http://www.gnu.org/licenses/>.
 */

/**
 * OAuth service
 */
(function (api, adguard) { // jshint ignore:line

    var TOKEN_STORAGE_PROP = 'sync-provider-auth-tokens';

    var accessTokens = null;
    var csrfState = null;

    var getAccessTokens = function () {
        if (accessTokens === null) {
            var tokens = adguard.localStorage.getItem(TOKEN_STORAGE_PROP);
            accessTokens = tokens ? JSON.parse(tokens) : Object.create(null);
        }
        return accessTokens;
    };

    /**
     * Clears provider token
     * @param providerName
     */
    function clearToken(providerName) {
        accessTokens = getAccessTokens();
        delete accessTokens[providerName];
        adguard.localStorage.setItem(TOKEN_STORAGE_PROP, JSON.stringify(accessTokens));
    }

    /**
     * Gets random one time token
     * @returns {*}
     */
    var getOrGenerateCSRFState = function () {
        if (csrfState === null) {
            csrfState = Math.random().toString(36).substring(7);
        }
        return csrfState;
    };

    /**
     * Returns provider token
     * @param providerName
     * @returns {null}
     */
    var getToken = function (providerName) {
        var tokens = getAccessTokens()[providerName];
        if (tokens) {
            return tokens.token;
        }
        return null;
    };

    /**
     * Sets provider token
     * @param providerName
     * @param token
     * @param csrfState
     * @param expires
     * @returns {boolean}
     */
    var setToken = function (providerName, token, csrfState, expires) {

        if (csrfState !== getOrGenerateCSRFState()) {
            adguard.console.warn("Security token doesn't match");
            return false;
        }

        var accessTokens = getAccessTokens();
        accessTokens[providerName] = {
            token: token,
            expires: expires ? Date.now() + parseInt(expires) * 1000 : null
        };

        adguard.console.info('Set OAuth token {0} for sync provider {1}', token, providerName);

        adguard.localStorage.setItem(TOKEN_STORAGE_PROP, JSON.stringify(accessTokens));
        return true;
    };

    /**
     * Checks if token is presented and up to date
     * @param providerName
     * @returns {boolean}
     */
    var isAuthorized = function (providerName) {
        var provider = api.syncProviders.getProvider(providerName);
        if (!provider) {
            return false;
        }
        if (!provider.isOAuthSupported) {
            return true;
        }
        if (!getToken(providerName)) {
            return false;
        }
        return !isTokenExpired(providerName);
    };

    /**
     * Checks the token is presented but expired
     * @param providerName
     */
    var isTokenExpired = function (providerName) {
        var tokens = getAccessTokens()[providerName];
        if (!tokens || !tokens.token || !tokens.expires) {
            return false;
        }
        return Date.now() > tokens.expires;
    };

    /**
     * Opens a tab with auth url
     * @param providerName
     */
    var authorize = function (providerName) {
        var provider = api.syncProviders.getProvider(providerName);
        if (!provider) {
            return;
        }
        if (!provider.isOAuthSupported) {
            adguard.console.warn('Sync provider doesn\'t support oauth');
            return;
        }
        adguard.tabs.create({
            active: true,
            type: 'popup',
            url: provider.getAuthUrl('https://testauth.adguard.com/oauth.html?provider=' + providerName, getOrGenerateCSRFState())
        });
    };

    /**
     * Clear and revoke provider's token
     */
    var clearAndRevokeToken = function (providerName) {
        var provider = api.syncProviders.getProvider(providerName);
        if (!provider) {
            return;
        }
        if (!provider.isOAuthSupported) {
            adguard.console.warn('Sync provider doesn\'t support oauth');
            return;
        }
        var token = getToken(providerName);
        if (token) {
            clearToken(providerName);
            provider.revokeToken(token);
        }
        adguard.console.info('Remove OAuth token \'{0}\' for sync provider {1}', token, providerName);
    };

    // EXPOSE
    api.oauthService = {
        /**
         * Returns auth token
         */
        getToken: getToken,
        /**
         * Sets auth token
         */
        setToken: setToken,
        /**
         * Checks if token is presented and up to date
         */
        isAuthorized: isAuthorized,
        /**
         * Opens auth tab
         */
        authorize: authorize,
        /**
         * Clear and revoke provider's token
         */
        clearAndRevokeToken: clearAndRevokeToken
    };

})(adguard.sync, adguard);