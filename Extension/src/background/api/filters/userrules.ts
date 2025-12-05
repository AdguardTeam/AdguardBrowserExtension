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
import { RuleParser } from '@adguard/agtree/parser';
import {
    ConvertedFilterList,
    RuleSyntaxUtils,
    findNextLineBreakIndex,
} from '@adguard/tsurlfilter';

import { logger } from '../../../common/logger';
import {
    AntiBannerFiltersId,
    NEWLINE_CHAR_REGEX,
    NEWLINE_CHAR_UNIX,
    NotifierType,
} from '../../../common/constants';
import { SettingOption } from '../../schema';
import { notifier } from '../../notifier';
import {
    FiltersStorage,
    settingsStorage,
    editorStorage,
} from '../../storages';
import { FiltersStoragesAdapter } from '../../storages/filters-adapter';
import { getZodErrorMessage } from '../../../common/error';

/**
 * API for managing user rules list.
 */
export class UserRulesApi {
    /**
     * Parses data from user rules list.
     * If it's undefined or if it's an initialization after installation - sets
     * empty user rules list.
     *
     * @param isInstall Is this is an installation initialization or not.
     */
    public static async init(isInstall: boolean): Promise<void> {
        try {
            // Check if user filter is present in the storage to avoid errors.
            if (!(await FiltersStorage.has(AntiBannerFiltersId.UserFilterId))) {
                await FiltersStorage.set(
                    AntiBannerFiltersId.UserFilterId,
                    ConvertedFilterList.createEmpty(),
                );
            } else {
                // In this case zod will validate the data.
                await FiltersStorage.get(AntiBannerFiltersId.UserFilterId);
            }
        } catch (e) {
            if (!isInstall) {
                logger.warn('[ext.UserRulesApi.init]: cannot parse user filter list from persisted storage, reset to default. Origin error:', getZodErrorMessage(e));
            }
            await FiltersStorage.set(
                AntiBannerFiltersId.UserFilterId,
                ConvertedFilterList.createEmpty(),
            );
        }
    }

    /**
     * Checks, if user list is enabled.
     *
     * @returns True, if user list is enabled, else returns false.
     */
    public static isEnabled(): boolean {
        return settingsStorage.get(SettingOption.UserFilterEnabled);
    }

    /**
     * Checks, if user list contains rules for specified url.
     *
     * @param url Page url.
     *
     * @returns True, if user list contains rules for {@link url}, else returns false.
     */
    public static async hasRulesForUrl(url: string | undefined): Promise<boolean> {
        if (!url) {
            return false;
        }

        try {
            const content = (await UserRulesApi.getUserRules()).getContent();

            let ruleStartIndex = 0;
            // Note: we do not use `.split`, because we want to early exit if we find a rule for the given url,
            // without creating an array of all rules.
            // TODO: Use some scanner here from tsurlfilter instead of finding line breaks.
            let [lbIndex, lbLength] = findNextLineBreakIndex(content);

            while (lbIndex < content.length) {
                const rawRule = content.slice(ruleStartIndex, lbIndex);
                const ruleNode = RuleParser.parse(rawRule);

                if (RuleSyntaxUtils.isRuleForUrl(ruleNode, url)) {
                    return true;
                }

                ruleStartIndex = lbIndex + lbLength;
                [lbIndex, lbLength] = findNextLineBreakIndex(content, lbIndex + lbLength);
            }

            return false;
        } catch (e) {
            logger.error('[ext.UserRulesApi.hasRulesForUrl]: cannot check user rules for url, origin error:', e);
        }

        return false;
    }

    /**
     * Returns rules from user list.
     *
     * @returns User rules list.
     */
    public static async getUserRules(): Promise<ConvertedFilterList> {
        const data = await FiltersStorage.get(AntiBannerFiltersId.UserFilterId);

        if (!data) {
            return new ConvertedFilterList('', ConvertedFilterList.createEmptyConversionData());
        }

        return data;
    }

    /**
     * Returns original rules from user list.
     *
     * When we save user rules, the rules may be modified (e.g converted),
     * but when user opens the editor, we need to show their original rules.
     * User rules is a bit special because for that list we store the whole original filter list.
     * This method return that original list and we use it to load content in the editor.
     *
     * @returns User rules list.
     */
    public static async getOriginalUserRules(): Promise<string> {
        return (await FiltersStoragesAdapter.getOriginalFilterList(AntiBannerFiltersId.UserFilterId)) ?? '';
    }

    /**
     * Adds rule to user list.
     *
     * @param rule Rule text.
     */
    public static async addUserRule(rule: string): Promise<void> {
        let userRulesFilter = await UserRulesApi.getOriginalUserRules();

        if (!userRulesFilter.endsWith(NEWLINE_CHAR_UNIX)) {
            userRulesFilter += NEWLINE_CHAR_UNIX;
        }

        userRulesFilter += rule;

        await UserRulesApi.setUserRules(userRulesFilter);
    }

    /**
     * Removes rule from user list.
     *
     * @param rule Rule text.
     */
    public static async removeUserRule(rule: string): Promise<void> {
        const userRulesTest = await UserRulesApi.getOriginalUserRules();

        const userRulesToSave = userRulesTest.split(NEWLINE_CHAR_REGEX)
            .filter((r) => r !== rule)
            .join(NEWLINE_CHAR_UNIX);

        await UserRulesApi.setUserRules(userRulesToSave);
    }

    /**
     * Removes rule from user list by index.
     *
     * @param index Rule index.
     *
     * @returns True, if rule was removed, else returns false.
     */
    public static async removeUserRuleByIndex(index: number): Promise<boolean> {
        const filter = await FiltersStorage.get(AntiBannerFiltersId.UserFilterId);

        if (!filter) {
            return false;
        }

        const ruleText = filter.getOriginalRuleText(index);

        if (!ruleText) {
            return false;
        }

        await UserRulesApi.removeUserRule(ruleText);

        return true;
    }

    /**
     * Removes rules for specified url from user list.
     *
     * @param url Page url.
     */
    public static async removeRulesByUrl(url: string): Promise<void> {
        const userRulesTest = await UserRulesApi.getOriginalUserRules();

        await UserRulesApi.setUserRules(
            userRulesTest
                .split(NEWLINE_CHAR_REGEX)
                .filter((rule) => {
                    try {
                        return !RuleSyntaxUtils.isRuleForUrl(RuleParser.parse(rule), url);
                    } catch (e) {
                        // Possible parsing error here.
                        // Keep invalid rules in the list, because we need to keep everything that user added.
                        return true;
                    }
                })
                .join(NEWLINE_CHAR_UNIX),
        );
    }

    /**
     * Sets user rule list to storage.
     *
     * @param rulesText Rule text.
     */
    public static async setUserRules(rulesText: string): Promise<void> {
        await FiltersStorage.set(AntiBannerFiltersId.UserFilterId, rulesText);

        notifier.notifyListeners(NotifierType.UserFilterUpdated);
    }

    /**
     * Returns persisted rules during switches between common and fullscreen modes.
     *
     * @returns User rules editor content.
     */
    public static getEditorStorageData(): string | undefined {
        return editorStorage.get();
    }

    /**
     * Sets persisted rules during switches between common and fullscreen modes.
     *
     * @param data User rules editor content.
     */
    public static setEditorStorageData(data: string): void {
        editorStorage.set(data);
    }
}
