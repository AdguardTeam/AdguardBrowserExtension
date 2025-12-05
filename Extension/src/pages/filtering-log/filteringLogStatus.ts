/**
 * Copyright (c) 2015-2025 Adguard Software Ltd.
 *
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

import { type DeclarativeRule, RuleActionType } from '@adguard/tsurlfilter/es/declarative-converter';

import { type DeclarativeRuleInfo } from 'tswebextension';

import { type UIFilteringLogEvent } from '../../background/api';

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

export const getDeclarativeStatusMode = (declarativeRuleInfo: DeclarativeRuleInfo) => {
    const { sourceRules, declarativeRuleJson } = declarativeRuleInfo;
    const rule = JSON.parse(declarativeRuleJson) as DeclarativeRule;

    // Small hack to show rules with $redirect as blocked for keep legacy logic.
    if (rule.action.type === RuleActionType.REDIRECT
        && sourceRules.some(({ sourceRule }) => (
            sourceRule.includes('$redirect=')
            || sourceRule.includes(',redirect=')
        ))
    ) {
        return StatusMode.BLOCKED;
    }

    switch (rule.action.type) {
        case RuleActionType.BLOCK: {
            return StatusMode.BLOCKED;
        }

        case RuleActionType.MODIFY_HEADERS:
        case RuleActionType.REDIRECT: {
            return StatusMode.MODIFIED;
        }

        case RuleActionType.ALLOW_ALL_REQUESTS:
        case RuleActionType.UPGRADE_SCHEME:
        case RuleActionType.ALLOW: {
            return StatusMode.ALLOWED;
        }

        default: {
            return StatusMode.REGULAR;
        }
    }
};

/**
 * Returns filtering log status
 *
 * @param {object} event - filtering log event
 *
 * @returns {string}
 */
export const getStatusMode = (event: UIFilteringLogEvent) => {
    const {
        cspReportBlocked,
        replaceRules,
        stealthAllowlistRules,
        requestRule,
        removeParam,
        removeHeader,
        isModifyingCookieRule,
        declarativeRuleInfo,
    } = event;

    if (declarativeRuleInfo !== undefined) {
        return getDeclarativeStatusMode(declarativeRuleInfo);
    }

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
            permissionsRule,
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
        } else if (cspRule || permissionsRule) {
            mode = StatusMode.MODIFIED;
        } else {
            mode = StatusMode.BLOCKED;
        }
    }

    return mode;
};
