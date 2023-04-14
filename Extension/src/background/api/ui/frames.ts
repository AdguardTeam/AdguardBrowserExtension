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
    type TabContext,
    isHttpRequest,
    getDomain,
    MAIN_FRAME_ID,
} from '@adguard/tswebextension';

import { AntiBannerFiltersId } from '../../../common/constants';
import { SettingOption } from '../../schema';
import { appContext, AppContextKey } from '../../storages';
import { PageStatsApi } from '../filters';
import { SettingsApi } from '../settings';

export type FrameRule = {
    filterId: number,
    ruleText: string,
};

export type FrameData = {
    url: string | null,
    domainName: string | null,
    applicationAvailable: boolean,
    applicationFilteringDisabled: boolean,
    urlFilteringDisabled: boolean,
    documentAllowlisted: boolean,
    userAllowlisted: boolean,
    canAddRemoveRule: boolean,
    frameRule: FrameRule | null,
    totalBlockedTab: number,
    totalBlocked: number,
};

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
    }: TabContext): FrameData {
        const mainFrame = frames.get(MAIN_FRAME_ID);

        const url = info?.url
            || mainFrame?.url
            || null;

        const domainName = url ? getDomain(url) : null;

        const urlFilteringDisabled = !url || !isHttpRequest(url);

        const applicationAvailable = appContext.get(AppContextKey.IsInit) && !urlFilteringDisabled;

        let frameRule: FrameRule | null = null;
        let documentAllowlisted = false;
        let userAllowlisted = false;
        let canAddRemoveRule = false;

        const totalBlocked = PageStatsApi.getTotalBlocked();

        const totalBlockedTab = blockedRequestCount;
        const applicationFilteringDisabled = SettingsApi.getSetting(SettingOption.DisableFiltering);

        if (applicationAvailable) {
            documentAllowlisted = !!mainFrameRule && mainFrameRule.isDocumentAllowlistRule();
            if (documentAllowlisted && mainFrameRule) {
                const rule = mainFrameRule;

                const filterId = rule.getFilterListId();

                userAllowlisted = filterId === AntiBannerFiltersId.UserFilterId
                       || filterId === AntiBannerFiltersId.AllowlistFilterId;
                frameRule = {
                    filterId,
                    ruleText: rule.getText(),
                };
            }
            // It means site in exception
            canAddRemoveRule = !(documentAllowlisted && !userAllowlisted);
        }

        return {
            url,
            applicationAvailable,
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
