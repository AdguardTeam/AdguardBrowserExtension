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
import zod from 'zod';

export const localScriptRulesValidator = zod.object({
    /**
     * Contains a comment describing the purpose of the local script rules file.
     */
    comment: zod.string(),
    /**
     * JS rules from all of our filters are pre-assembled into this object to be
     * checked in Firefox AMO to see if they can be executed.
     */
    rules: zod.record(
        /**
         * Key is the cosmetic rule body.
         */
        zod.string(),

        /**
         * Value is the array of cosmetic rule scope (on which domains it should be applied).
         * If multiple rules are using the same body, their scopes are pushed to this array,
         * if they are not already there.
         */
        zod.object({
            /**
             * The array of domains on which the rule can be executed.
             */
            permittedDomains: zod.array(zod.string()),

            /**
             * The array of domains on which the rule cannot be executed.
             */
            restrictedDomains: zod.array(zod.string()),
        }).array(),
    ),
}).strict();

/**
 * Describes the structure of the local script rules file, which is necessary
 * for Firefox AMO to check if JS rules can be executed.
 */
export type LocalScriptRules = zod.infer<typeof localScriptRulesValidator>;
