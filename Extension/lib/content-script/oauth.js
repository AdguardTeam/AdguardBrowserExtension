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

    function getParameter(name, str) {
        if (!str) {
            return;
        }
        var start = str.indexOf(name + '=');
        if (start >= 0) {
            start = start + (name + '=').length;
            var end = str.indexOf('&', start);
            if (end < 0) {
                end = str.length;
            }
            return str.substring(start, end);
        }
        return null;
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

    if (document.domain === 'injections.adguard.com') {

        var hash = window.location.hash;
        var search = window.location.search;
        var token = getParameter('access_token', hash);
        var provider = getParameter('provider', search);
        var securityToken = getParameter('state', search);
        var error = getParameter('error', hash);

        if (error) {
            var errorDescription = getParameter('error_description', hash);
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
                securityToken: securityToken
            });
        }
    }

})();