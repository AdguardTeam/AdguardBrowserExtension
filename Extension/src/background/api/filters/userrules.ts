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
import {
    AnyRule,
    InputByteBuffer,
    RuleParser,
} from '@adguard/agtree';
import { PreprocessedFilterList, RuleSyntaxUtils } from '@adguard/tsurlfilter';

import { logger } from '../../../common/logger';
import { AntiBannerFiltersId } from '../../../common/constants';
import { SettingOption } from '../../schema';
import { listeners } from '../../notifier';
import {
    FiltersStorage,
    settingsStorage,
    editorStorage,
} from '../../storages';

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
            const userRules = await FiltersStorage.get(AntiBannerFiltersId.UserFilterId);

            if (!userRules) {
                await FiltersStorage.set(AntiBannerFiltersId.UserFilterId, []);
            }
        } catch (e) {
            if (!isInstall) {
                logger.warn(
                    'Cannot parse user filter list from persisted storage, reset to default. Origin error: ',
                    e,
                );
            }
            await FiltersStorage.set(AntiBannerFiltersId.UserFilterId, []);
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
            const chunks = await UserRulesApi.getBinaryUserRules();
            const buffer = new InputByteBuffer(chunks);
            let ruleNode: AnyRule;
            // If the next byte is 0, it means that there's nothing to read.
            while (buffer.peekUint8() !== 0) {
                RuleParser.deserialize(buffer, ruleNode = {} as AnyRule);
                if (RuleSyntaxUtils.isRuleForUrl(ruleNode, url)) {
                    return true;
                }
            }
        } catch (e) {
            logger.error('Cannot check user rules for url', e);
        }

        return false;
    }

    /**
     * Returns rules from user list.
     */
    public static async getUserRules(): Promise<PreprocessedFilterList> {
        const data = await FiltersStorage.getAllFilterData(AntiBannerFiltersId.UserFilterId);

        if (!data) {
            return {
                rawFilterList: '',
                filterList: [],
                sourceMap: {},
                conversionMap: {},
            };
        }

        return data;
    }

    /**
     * Returns binary serialized, preprocessed rules from user list.
     *
     * @note This may include converted rules and does not include syntactically invalid rules.
     */
    public static async getBinaryUserRules(): Promise<Uint8Array[]> {
        const data = await FiltersStorage.get(AntiBannerFiltersId.UserFilterId);

        if (!data) {
            return [];
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
     */
    public static async getOriginalUserRules(): Promise<string[]> {
        return FiltersStorage.getOriginalRules(AntiBannerFiltersId.UserFilterId);
    }

    /**
     * Adds rule to user list.
     *
     * @param rule Rule text.
     */
    public static async addUserRule(rule: string): Promise<void> {
        const userRules = await UserRulesApi.getOriginalUserRules();

        userRules.push(rule);

        await UserRulesApi.setUserRules(userRules);
    }

    /**
     * Removes rule from user list.
     *
     * @param rule Rule text.
     */
    public static async removeUserRule(rule: string): Promise<void> {
        const userRules = await UserRulesApi.getOriginalUserRules();

        await UserRulesApi.setUserRules(userRules.filter((r) => r !== rule));
    }

    /**
     * Removes rules for specified url from user list.
     *
     * @param url Page url.
     */
    public static async removeRulesByUrl(url: string): Promise<void> {
        const userRules = await UserRulesApi.getOriginalUserRules();

        await UserRulesApi.setUserRules(
            userRules.filter((rule) => {
                try {
                    return !RuleSyntaxUtils.isRuleForUrl(RuleParser.parse(rule), url);
                } catch (e) {
                    // Possible parsing error here.
                    // Keep invalid rules in the list, because we need to keep everything that user added.
                    return true;
                }
            }),
        );
    }

    /**
     * Sets user rule list to storage.
     *
     * @param rules List of rule strings.
     */
    public static async setUserRules(rules: string[]): Promise<void> {
        await FiltersStorage.set(AntiBannerFiltersId.UserFilterId, rules);

        listeners.notifyListeners(listeners.UserFilterUpdated);
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
