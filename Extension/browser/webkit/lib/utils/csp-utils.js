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

/* global exports */

/**
 * CSP header utils
 */
var CspUtils = exports.CspUtils = (function () {

    // https://w3c.github.io/webappsec-csp/#directives-reporting
    var reReportDirective = /report-(?:to|uri)[^;]*;?\s*/;
    var reEmptyDirective = /^([a-z-]+)\s*;/;

    /**
     * Fills csp header with websocket blocking directives.
     * Checks connect-src and frame-src directives. Removes 'wss:' and 'data:' from it.
     * @param headers headers collection block websocket flag
     */
    var blockWebSockets = function (headers) {
        var i = headerIndexFromName('content-security-policy', headers),
            before = i === -1 ? '' : headers[i].value.trim(),
            after = before;

        /*
         https://bugs.chromium.org/p/chromium/issues/detail?id=513860
         Bad Chromium bug: web pages can work around CSP directives by
         creating data:- or blob:-based URI. So if we must restrict using CSP,
         we have no choice but to also prevent the creation of nested browsing
         contexts based on data:- or blob:-based URIs.
         https://github.com/AdguardTeam/AdguardBrowserExtension/issues/344
         */
        // https://w3c.github.io/webappsec-csp/#directive-frame-src
        after = writeCSPDirective(
            after,
            /frame-src[^;]*;?\s*/,
            'frame-src http:',
            /data:[^\s]*\s*|blob:[^\s]*\s*/g
        );

        var changed = after !== before;
        if (changed) {
            if (i !== -1) {
                headers.splice(i, 1);
            }
            headers.push({name: 'Content-Security-Policy', value: after});
        }

        return changed;
    };

    var writeCSPDirective = function (csp, template, toAdd, toRemove) {
        // Set
        if (csp === '') {
            return toAdd;
        }

        var matches = template.exec(csp);

        // Add
        if (matches === null) {
            if (csp.slice(-1) !== ';') {
                csp += ';';
            }
            csp += ' ' + toAdd;
            return csp.replace(reReportDirective, '');
        }

        var directive = matches[0];

        // No change
        if (toRemove.test(directive) === false) {
            return csp;
        }

        // Remove
        csp = csp.replace(template, '').trim();
        if (csp.slice(-1) !== ';') {
            csp += ';';
        }
        directive = directive.replace(toRemove, '').trim();

        // Check for empty directive after removal
        matches = reEmptyDirective.exec(directive);
        if (matches) {
            directive = matches[1] + " 'none';";
        }

        csp += ' ' + directive;
        return csp.replace(reReportDirective, '');
    };

    var headerIndexFromName = function (headerName, headers) {
        var i = headers.length;
        while (i--) {
            if (headers[i].name.toLowerCase() === headerName) {
                return i;
            }
        }
        return -1;
    };

    return {
        blockWebSockets: blockWebSockets
    };
})();