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

                let ruleText = '';

                // FIXME: Restore .getText() in tsurlfilter

                // let ruleText = engine.api.retrieveRuleText(
                //     mainFrameRule.getFilterListId(),
                //     mainFrameRule.getIndex(),
                // );

                if (!ruleText) {
                    ruleText = '<Cannot retrieve rule text>';
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
