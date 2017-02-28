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
(function (adguard) { // jshint ignore:line

    var TOKEN_STORAGE_PROP = 'sync-provider-auth-tokens';

    var accessTokens = Object.create(null);
    var securityToken;
    var expires;

    var getAccessTokens = function () {
        if (!accessTokens) {
            accessTokens = adguard.localStorage.getItem(TOKEN_STORAGE_PROP) || Object.create(null);
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
     * @param provider
     * @param redirectUri
     * @returns {null}
     */
    var getAuthUrl = function (provider, redirectUri) {
        var securityToken = getSecurityToken();

        if (provider && typeof provider.getAuthUrl === 'function') {
            return provider.getAuthUrl(redirectUri, securityToken);
        }

        return null;
    };

    /**
     * Returns provider token
     * @param provider
     * @returns {null}
     */
    var getToken = function (provider) {
        var tokens = getAccessTokens();
        if (tokens) {
            return tokens[provider.name];
        }

        return null;
    };

    /**
     * Sets provider token
     * @param provider
     * @param token
     * @param expires
     */
    var setToken = function (provider, token, expires) {
        var tokens = getAccessTokens();

        tokens[provider.name] = token;
        accessTokens = tokens;

        adguard.localStorage.setItem(TOKEN_STORAGE_PROP, accessTokens);

        //TODO: Save expires
    };

    /**
     * Revokes provider token
     * @param provider
     */
    var revokeToken = function (provider) {
        var tokens = getAccessTokens();
        if (tokens[provider.name]) {
            if (provider && typeof provider.revokeToken === 'function') {
                provider.revokeToken();
            }

            setToken(provider, null);
        }
    };

    // EXPOSE
    adguard.oauthService = {
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

})(adguard);