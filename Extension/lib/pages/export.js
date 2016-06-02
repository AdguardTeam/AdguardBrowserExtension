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
/* global $, contentPage */
$(document).ready(function () {

    var callback = function (response) {

        var rules = response.rules;

        if (!rules || rules.length === 0) {
            return;
        }

        var el = $('<pre/>');
        var rulesText = rules ? rules.join('\r\n') : '';
        el.text(rulesText);
        $("body").append(el);

        var filename = whitelist ? 'whitelist.txt' : 'rules.txt';
        if (showSaveFunc) {
            showSaveFunc(rulesText, filename, 'text/plain;charset=utf-8');
        }
    };

    var whitelist = document.location.hash == '#wl';
    var messageType;
    if (whitelist) {
        messageType = 'getWhiteListDomains';
    } else {
        messageType = 'getUserFilters';
    }

    contentPage.sendMessage({type: messageType}, callback);
});

var showSaveFunc = (function () {

    var showSave;
    var DownloadAttributeSupport = 'download' in document.createElement('a');

    var Blob = window.Blob || window.WebKitBlob || window.MozBlob;
    var URL = window.URL || window.webkitURL || window.mozURL;

    navigator.saveBlob = navigator.saveBlob || navigator.mozSaveBlob || navigator.webkitSaveBlob;
    window.saveAs = window.saveAs || window.webkitSaveAs || window.mozSaveAs || window.msSaveAs;

    if (Blob && navigator.saveBlob) {
        showSave = function (data, name, mimetype) {
            var blob = new Blob([data], {type: mimetype});
            if (window.saveAs) {
                window.saveAs(blob, name);
            } else {
                navigator.saveBlob(blob, name);
            }
        };
    } else if (Blob && URL) {
        showSave = function (data, name, mimetype) {
            var blob, url;
            if (DownloadAttributeSupport) {
                blob = new Blob([data], {type: mimetype});
                url = URL.createObjectURL(blob);
                var link = document.createElement("a");
                link.setAttribute("href", url);
                link.setAttribute("download", name || "Download.bin");
                $('body').append(link);
                $(link).get(0).click();
            } else {
                blob = new Blob([data], {type: mimetype});
                url = URL.createObjectURL(blob);
                window.open(url, '_blank', '');
            }
            setTimeout(function () {
                URL.revokeObjectURL(url);
            }, 250);
        };
    }
    return showSave;
})();
