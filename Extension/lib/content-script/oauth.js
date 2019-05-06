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
        const params = {};
        const regex = /([^&=]+)=([^&]*)/g;
        let part;
        while (part = regex.exec(queryString)) { // eslint-disable-line
            params[decodeURIComponent(part[1])] = decodeURIComponent(part[2]);
        }
        return params;
    }

    function showError(error, description) {
        if (description) {
            description = description.replace(/\+/g, ' ');
            const element = document.getElementById('errorDescription');
            if (element) {
                element.appendChild(document.createTextNode(description));
            }
        }
    }

    let { hash } = window.location;
    if (hash) {
        hash = hash.substring(1);
    }
    let { search } = window.location;
    if (search) {
        search = search.substring(1);
    }
    const hashParams = getParams(hash);
    const searchParams = getParams(search);

    const { provider } = searchParams;
    const token = hashParams.access_token;
    const csrfState = hashParams.state ? hashParams.state : searchParams.state;
    const { error } = hashParams;
    const expires = hashParams.expires_in;

    if (error) {
        const errorDescription = hashParams.error_description;
        showError(error, errorDescription);
        // TODO[SYNC]: handle this case
        return;
    }

    if (token && provider) {
        contentPage.sendMessage({
            type: 'setOAuthToken',
            provider,
            token,
            csrfState,
            expires,
        });
    }
})();
