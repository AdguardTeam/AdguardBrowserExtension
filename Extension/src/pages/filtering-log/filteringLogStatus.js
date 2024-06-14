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
    ALLOWED_STEALTH: 'allowed-stealth',
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
        stealthAllowlistRules,
        requestRule,
        removeParam,
        removeHeader,
        isModifyingCookieRule,
    } = event;

    let mode = StatusMode.REGULAR;

    if (cspReportBlocked) {
        mode = StatusMode.BLOCKED;
        return mode;
    }

    if (replaceRules) {
        mode = StatusMode.MODIFIED;
    }

    if (stealthAllowlistRules) {
        mode = StatusMode.ALLOWED_STEALTH;
    }

    if (requestRule && !replaceRules) {
        /**
         * All of these fields are fields that are "synthetically" added to the
         * `FilteringLogEvent` of the tswebextension on the side of the extension
         * {@link FilteringLogApi.createCosmeticRuleEventData}.
         */
        const {
            allowlistRule,
            cssRule,
            scriptRule,
            cookieRule,
            cspRule,
        } = requestRule;

        if (allowlistRule) {
            // $stealth allowlist rules are not being marked as allowed
            // to prevent log cluttering and conform with desktop applications
            mode = StatusMode.ALLOWED;
        } else if (cssRule || scriptRule || removeParam || removeHeader) {
            mode = StatusMode.MODIFIED;
        } else if (cookieRule) {
            if (isModifyingCookieRule) {
                mode = StatusMode.MODIFIED;
            } else {
                mode = StatusMode.BLOCKED;
            }
        } else if (cspRule) {
            mode = StatusMode.MODIFIED;
        } else {
            mode = StatusMode.BLOCKED;
        }
    }

    return mode;
};
