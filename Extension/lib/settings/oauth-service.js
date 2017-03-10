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
    var securityToken = null;
    var expires;

    /**
     * Finds sync provider by name
     * @param providerName Provider name
     * @returns {*}
     */
    function findProviderByName(providerName) {
        for (var key in api) {
            if (api.hasOwnProperty(key)) {
                var provider = api[key];
                if (provider.name === providerName) {
                    return provider;
                }
            }
        }
        return null;
    }

    var getAccessTokens = function () {
        if (!accessTokens) {
            accessTokens = JSON.parse(adguard.localStorage.getItem(TOKEN_STORAGE_PROP)) || Object.create(null);
        }

        return accessTokens;
    };

    /**
     * Gets random one time token
     * @returns {*}
     */
    var getSecurityToken = function () {
        if (!securityToken) {
            securityToken = Math.random().toString(36).substring(7);
        }
        return securityToken;
    };

    /**
     * Returns provider auth url
     * @param providerName
     * @param redirectUri
     * @returns {null}
     */
    var getAuthUrl = function (providerName, redirectUri) {
        var securityToken = getSecurityToken();

        var provider = findProviderByName(providerName);
        if (provider && typeof provider.getAuthUrl === 'function') {
            return provider.getAuthUrl(redirectUri, securityToken);
        }

        return null;
    };

    /**
     * Returns provider token
     * @param providerName
     * @returns {null}
     */
    var getToken = function (providerName) {
        var tokens = getAccessTokens();
        if (tokens) {
            return tokens[providerName] ? tokens[providerName].token : null;
        }

        return null;
    };

    /**
     * Sets provider token
     * @param providerName
     * @param token
     * @param securityToken
     * @param expires
     * @returns {boolean}
     */
    var setToken = function (providerName, token, securityToken, expires, refreshToken) {

        if (securityToken) {
            if (securityToken !== getSecurityToken()) {
                adguard.console.warn("Security token doesn't match");
                return false;
            }
        }

        var tokens = getAccessTokens();
        tokens[providerName] = {
            token: token,
            expires: expires ? Date.now() + parseInt(expires) * 1000 : null,
            refreshToken: refreshToken
        };
        accessTokens = tokens;

        //TODO: handle token expiration

        adguard.localStorage.setItem(TOKEN_STORAGE_PROP, JSON.stringify(accessTokens));

        return true;
    };

    /**
     * Revokes provider token
     * @param providerName
     */
    var revokeToken = function (providerName) {
        var tokens = getAccessTokens();
        if (tokens[providerName]) {
            var provider = findProviderByName(providerName);
            if (provider && typeof provider.revokeToken === 'function') {
                provider.revokeToken(tokens[providerName].token);
            }

            setToken(providerName, null);
        }
    };

    /**
     * Checks if token is presented and up to date
     * @param providerName
     * @returns {boolean}
     */
    var isAuthorized = function (providerName) {
        if (!getToken(providerName)) {
            adguard.console.warn("Unauthorized! Please set access token first.");
            return false;
        }

        //TODO: Check the token is fresh
        return true;
    };

    /**
     * Requests access and refresh token for access code
     * @param providerName
     * @param accessCode
     * @param successCallback
     */
    var requestAccessTokens = function (providerName, accessCode, successCallback) {
        var provider = findProviderByName(providerName);
        if (provider && typeof provider.requestAccessTokens === 'function') {
            provider.requestAccessTokens(accessCode, function (token, refreshToken, expires) {
                if (setToken(providerName, token, null, expires, refreshToken)) {
                    successCallback();
                }
            });
        }
    };

    // EXPOSE
    api.oauthService = {
        /**
         * Returns auth url
         */
        getAuthUrl: getAuthUrl,
        /**
         * Returns auth token
         */
        getToken: getToken,
        /**
         * Sets auth token
         */
        setToken: setToken,
        /**
         * Revokes auth token
         */
        revokeToken: revokeToken,
        /**
         * Checks if token is presented and up to date
         */
        isAuthorized: isAuthorized,
        /**
         * Requests access and refresh token for access code
         */
        requestAccessTokens: requestAccessTokens
    };

})(adguard.sync, adguard);