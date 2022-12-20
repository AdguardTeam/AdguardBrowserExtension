/**
 * @file
 * This file is part of AdGuard Browser Extension (https://github.com/AdguardTeam/AdguardBrowserExtension).
 *
 * AdGuard Browser Extension is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * AdGuard Browser Extension is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with AdGuard Browser Extension. If not, see <http://www.gnu.org/licenses/>.
 */

/**
 * @typedef {object} StatusMode
 * @property {string} REGULAR
 * @property {string} MODIFIED
 * @property {string} BLOCKED
 * @property {string} ALLOWED
 */
export const StatusMode = {
    REGULAR: 'regular',
    MODIFIED: 'modified',
    BLOCKED: 'blocked',
    ALLOWED: 'allowed',
};

/**
 * Returns filtering log status
 *
 * @param {object} event - filtering log event
 * @returns {string}
 */
export const getStatusMode = (event) => {
    const {
        cspReportBlocked,
        replaceRules,
        requestRule,
        removeParam,
        removeHeader,
    } = event;

    let mode = StatusMode.REGULAR;

    if (cspReportBlocked) {
        mode = StatusMode.BLOCKED;
        return mode;
    }

    if (replaceRules) {
        mode = StatusMode.MODIFIED;
    }

    if (requestRule && !replaceRules) {
        if (requestRule.allowlistRule) {
            mode = StatusMode.ALLOWED;
            // eslint-disable-next-line max-len
        } else if (requestRule.cssRule || requestRule.scriptRule || removeParam || removeHeader) {
            mode = StatusMode.MODIFIED;
        } else if (requestRule.cookieRule) {
            if (requestRule.isModifyingCookieRule) {
                mode = StatusMode.MODIFIED;
            } else {
                mode = StatusMode.BLOCKED;
            }
        } else if (requestRule.cspRule) {
            mode = StatusMode.MODIFIED;
        } else {
            mode = StatusMode.BLOCKED;
        }
    }

    return mode;
};
