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
 * Service for sync providers registration
 */
(function (api) {

    function unsupportedError() {
        throw new Error('Unsupported');
    }

    function noOpFunc() {

    }

    var providers = Object.create(null);

    var providerAPI = {
        get name() {
            return 'BASE_SYNC_PROVIDER';
        },
        get title() {
            return 'Sync provider';
        },
        get isOAuthSupported() {
            return false;
        },
        // Storage api
        load: unsupportedError,
        save: unsupportedError,
        init: noOpFunc,
        shutdown: noOpFunc,
        // Auth api
        getAuthUrl: unsupportedError,
        revokeToken: unsupportedError
    };

    /**
     * Registers provider service
     * @param name
     * @param methods
     */
    var register = function (name, methods) {
        var o = Object.create(providerAPI);
        Object.getOwnPropertyNames(methods).forEach(function (method) {
            if (!(method in providerAPI)) {
                throw new Error('Unknown provider method ' + method);
            }
            o[method] = methods[method];
        });
        Object.defineProperty(o, 'name', {
            value: name
        });
        Object.defineProperty(o, 'title', {
            value: methods.title || name
        });
        Object.defineProperty(o, 'isOAuthSupported', {
            value: methods.isOAuthSupported || false
        });
        providers[name] = o;
    };

    /**
     * Finds provider by name
     * @param name
     * @returns {*}
     */
    var getProvider = function (name) {
        return providers[name];
    };

    /**
     * Returns list of registered providers
     * @returns {Array}
     */
    var getProvidersInfo = function () {
        var result = [];
        Object.getOwnPropertyNames(providers).forEach(function (name) {
            var provider = providers[name];
            result.push({
                name: name,
                title: provider.title,
                isOAuthSupported: provider.isOAuthSupported,
                isAuthorized: api.oauthService.isAuthorized(name)
            });
        });
        return result;
    };

    api.syncProviders = {
        register: register,
        getProvider: getProvider,
        getProvidersInfo: getProvidersInfo
    };

})(adguard.sync);