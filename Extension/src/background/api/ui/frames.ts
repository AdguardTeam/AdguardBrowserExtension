/**
 * Copyright (c) 2015-2026 Adguard Software Ltd.
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

import { RULE_INDEX_NONE } from '@adguard/tsurlfilter';

import {
    getDomain,
    isHttpRequest,
    MAIN_FRAME_ID,
    type TabContext,
} from '../../tswebextension';
import { AntiBannerFiltersId } from '../../../common/constants';
import { SettingOption } from '../../schema';
import { appContext, AppContextKey } from '../../storages';
import { PageStatsApi } from '../page-stats';
import { SettingsApi } from '../settings';
import { engine } from '../../engine';
import { logger } from '../../../common/logger';

type FrameRule = {
    filterId: number;
    ruleText: string;
};

export type FrameData = {
    /**
     * Url of the tab.
     */
    url: string | null;

    /**
     * Domain of the tab's url.
     */
    domainName: string | null;

    /**
     * Is background already started and filtering is possible.
     */
    isFilteringPossible: boolean;

    /**
     * Is filtering disabled or enabled in extension settings.
     */
    applicationFilteringDisabled: boolean;

    /**
     * If url of current tab is not http.
     */
    urlFilteringDisabled: boolean;

    /**
     * If main frame rule disabled filtering in current tab.
     */
    documentAllowlisted: boolean;

    /**
     * If main frame rule from user rules or from allowlist.
     */
    userAllowlisted: boolean;

    /**
     * Is current url of the tab in the exceptions or not.
     */
    canAddRemoveRule: boolean;

    /**
     * Main frame rule - rule which applied to entire frame, e.g. $document, $all, etc.
     */
    frameRule: FrameRule | null;

    /**
     * Number of blocked request for current tab.
     */
    totalBlockedTab: number;

    /**
     * Number of blocked request for entire extension.
     */
    totalBlocked: number;
};

type MainFrameDataInfo = Pick<TabContext, 'info' | 'frames' | 'blockedRequestCount' | 'mainFrameRule'>;

/**
 * Helper class for retrieving main frame data from both tswebextension and app state.
 */
export class FramesApi {
    /**
     * Tries to find the main frame data for the provided tab context
     * and returns it.
     *
     * @param tabContext Tab context.
     * @param tabContext.info Tab's context information from webextension tabs API.
     * @param tabContext.frames Tab's context frames.
     * @param tabContext.blockedRequestCount Tab's context blocked request count.
     * @param tabContext.mainFrameRule Tab's context document level rule.
     *
     * @returns The {@link FrameData} object can be partially empty if no frames
     * were found for a given tab context.
     */
    public static getMainFrameData({
        info,
        frames,
        blockedRequestCount,
        mainFrameRule,
    }: MainFrameDataInfo): FrameData {
        const mainFrame = frames.get(MAIN_FRAME_ID);

        const url = info?.url
            || mainFrame?.url
            || null;

        const domainName = url ? getDomain(url) : null;

        const urlFilteringDisabled = !url || !isHttpRequest(url);

        const isFilteringPossible = appContext.get(AppContextKey.IsInit) && !urlFilteringDisabled;

        let frameRule: FrameRule | null = null;
        let documentAllowlisted = false;
        let userAllowlisted = false;
        let canAddRemoveRule = false;

        const totalBlocked = PageStatsApi.getTotalBlocked();

        const totalBlockedTab = blockedRequestCount;
        const applicationFilteringDisabled = SettingsApi.getSetting(SettingOption.DisableFiltering);

        if (isFilteringPossible) {
            documentAllowlisted = !!mainFrameRule && mainFrameRule.isFilteringDisabled();
            if (documentAllowlisted && mainFrameRule) {
                const filterId = mainFrameRule.getFilterListId();

                userAllowlisted = filterId === AntiBannerFiltersId.UserFilterId
                       || filterId === AntiBannerFiltersId.AllowlistFilterId;

                const ruleIndex = mainFrameRule.getIndex();

                // Resolve the human-readable rule text.
                //
                // `@adguard/tsurlfilter` stores rule text in one of two places,
                // depending on whether the rule has a source position in a filter list
                // (see the `NetworkRule`/`CosmeticRule` constructor contract):
                // - Indexed rules (`ruleIndex !== RULE_INDEX_NONE`) do not keep their text
                //   inline to save memory, so it must be retrieved from the engine by index.
                // - Synthetic rules (`ruleIndex === RULE_INDEX_NONE`), such as the
                //   document-level allowlist rules generated at runtime in inverted allowlist
                //   mode, have no source position and expose their text via `getText()`.
                let ruleText = ruleIndex !== RULE_INDEX_NONE
                    ? engine.api.retrieveRuleText(filterId, ruleIndex)
                    : mainFrameRule.getText();

                if (!ruleText) {
                    ruleText = `<cannot retrieve rule text: ${filterId}:${ruleIndex}>`;

                    // Only an indexed rule that fails to resolve is unexpected. A synthetic
                    // rule without inline text is not an error and must not be logged, since
                    // it occurs on normal page loads and would otherwise flood the log.
                    if (ruleIndex !== RULE_INDEX_NONE) {
                        logger.error(`[ext.FramesApi.getMainFrameData]: Cannot retrieve rule text: ${filterId}:${ruleIndex}`);
                    }
                }

                frameRule = {
                    filterId,
                    ruleText,
                };
            }
            // It means site in exception
            canAddRemoveRule = !(documentAllowlisted && !userAllowlisted);
        }

        return {
            url,
            isFilteringPossible,
            domainName,
            applicationFilteringDisabled,
            urlFilteringDisabled,
            documentAllowlisted,
            userAllowlisted,
            canAddRemoveRule,
            frameRule,
            totalBlockedTab,
            totalBlocked,
        };
    }
}
