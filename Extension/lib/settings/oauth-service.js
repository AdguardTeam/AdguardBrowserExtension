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

    var accessTokens = Object.create(null);
    var securityToken;
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
        var token = securityToken;
        if (!token) {
            token = Math.random().toString(36).substring(7);
        } else {
            securityToken = null;
        }

        return token;
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
            return tokens[providerName];
        }

        return null;
    };

    /**
     * Sets provider token
     * @param providerName
     * @param token
     * @param expires
     */
    var setToken = function (providerName, token, expires) {
        var tokens = getAccessTokens();

        tokens[providerName] = token;
        accessTokens = tokens;

        adguard.localStorage.setItem(TOKEN_STORAGE_PROP, JSON.stringify(accessTokens));

        //TODO: Save expires
    };

    /**
     * Revokes provider token
     * @param providerName
     */
    var revokeToken = function (providerName) {
        var tokens = getAccessTokens();
        var token = tokens[providerName];
        if (token) {
            var provider = findProviderByName(providerName);
            if (provider && typeof provider.revokeToken === 'function') {
                provider.revokeToken(token);
            }

            setToken(providerName, null);
        }
    };

    // EXPOSE
    api.oauthService = {
        /**
         * Returns saved one time token
         */
        getSecurityToken: getSecurityToken,
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
        revokeToken: revokeToken
    };

})(adguard.sync, adguard);