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

/* global contentPage */

(function () {

    'use strict';

    function getParams(queryString) {
        if (!queryString) {
            return {};
        }
        var params = {};
        var regex = /([^&=]+)=([^&]*)/g;
        var part;
        while (part = regex.exec(queryString)) { // jshint ignore:line
            params[decodeURIComponent(part[1])] = decodeURIComponent(part[2]);
        }
        return params;
    }

    function showError(error, description) {
        if (description) {
            description = description.replace(/\+/g, ' ');
            var element = document.getElementById('errorDescription');
            if (element) {
                element.appendChild(document.createTextNode(description));
            }
        }
    }

    if (document.domain === 'testsync.adguard.com') {

        var hash = window.location.hash;
        if (hash) {
            hash = hash.substring(1);
        }
        var search = window.location.search;
        if (search) {
            search = search.substring(1);
        }
        var hashParams = getParams(hash);
        var searchParams = getParams(search);

        var provider = searchParams.provider;
        var token = hashParams.access_token;
        var securityToken = hashParams.state;
        var error = hashParams.error;
        var expires = hashParams.expires_in;
        //var refreshToken = hashParams.refresh_token;

        if (error) {
            var errorDescription = hashParams.error_description;
            showError(error, errorDescription);
            contentPage.sendMessage({
                type: 'onAuthError',
                error: error,
                provider: provider
            });
            return;
        }

        if (token && provider) {
            contentPage.sendMessage({
                type: 'setOauthToken',
                provider: provider,
                token: token,
                securityToken: securityToken,
                expires: expires,
                //refreshToken: refreshToken
            });
        }
    }

})();