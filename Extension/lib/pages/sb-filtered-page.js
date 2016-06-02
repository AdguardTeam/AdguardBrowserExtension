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
/* global $, i18n, contentPage */

function getQueryParameters(queryString) {
    var params = Object.create(null);
    var vars = queryString.split("&");
    for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split("=");
        if (pair.length == 2) {
            params[pair[0]] = pair[1];
        }
    }
    return params;
}
function hideElements(className) {
    $.each($("." + className), function (idx, el) {
        el.className += "-hide";
    });
}
function onToggleClicked(toggleButton, reportButton, goButton) {
    toggleButton.attr('class', 'hidden');
    reportButton.attr('class', '');
    goButton.attr('class', 'redlink');
}

function isValid(param) {
    return param && param.indexOf('<') < 0;
}

$(document).ready(function () {

    var toggleButton = $("#toggle-button");
    var reportButton = $("#report-button");
    var goButton = $("#go-button");
    var goBackButton = $("#go-back-button");

    var params = getQueryParameters(document.location.search.substring(1));
    var isMalware = params.malware || true;
    if (isMalware == "true") {
        hideElements("phishing");
    } else {
        hideElements("malware");
    }

    var host = params.host;
    var url = params.url;
    var ref = params.ref;

    if (host) {
        var decodeHost = decodeURIComponent(host);
        if (isValid(decodeHost)) {
            reportButton.attr("href", "https://adguard.com/site.html?domain=" + host + "&utm_source=extension&aid=16593");
            i18n.translateElement(document.getElementById("malware-text"), "sb_malware_site", [decodeHost]);
            i18n.translateElement(document.getElementById("phishing-text"), "sb_phishing_site", [decodeHost]);
        }
    }

    if (url) {
        url = decodeURIComponent(url);
        if (isValid(url)) {
            goButton.attr("href", url);
            goButton.on('click', function (e) {
                e.preventDefault();
                contentPage.sendMessage({type: 'openSafebrowsingTrusted', url: this.href});
            });
        }
    }

    if (ref) {
        ref = decodeURIComponent(ref);
        if (isValid(ref)) {
            goBackButton.attr("href", ref);
            goBackButton.on('click', function (e) {
                e.preventDefault();
                document.location = ref;
            });
        }
    }

    toggleButton.on('click', function (e) {
        e.preventDefault();
        onToggleClicked(toggleButton, reportButton, goButton);
    });
});