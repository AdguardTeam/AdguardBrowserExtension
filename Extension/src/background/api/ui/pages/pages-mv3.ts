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
    Forward,
    ForwardAction,
    ForwardFrom,
} from '../../../../common/forward';
import { logger } from '../../../../common/logger';
import { isUserScriptsApiSupported } from '../../../../common/user-scripts-api';

import { PagesApiCommon } from './pages-common';

/**
 * Pages API provides methods for managing browser pages.
 */
export class PagesApi extends PagesApiCommon {
    /** @inheritdoc */
    protected thankYouPageUrl: string = Forward.get({
        action: ForwardAction.ThankYouMv3,
        from: ForwardFrom.Background,
    });

    /** @inheritdoc */
    protected chromeExtensionStoreForwardAction: ForwardAction.ChromeStore = ForwardAction.ChromeStore;

    /** @inheritdoc */
    // Ignoring custom filters in MV3 since AG-39385.
    // TODO: remove overriding when custom filters will be supported for MV3.
    // eslint-disable-next-line class-methods-use-this
    protected getCustomFiltersUrls(): string[] {
        return [];
    }

    /** @inheritdoc */
    // eslint-disable-next-line class-methods-use-this
    protected shouldOpenSettingsPageWithCustomFilterModal(): boolean {
        if (!isUserScriptsApiSupported()) {
            logger.debug('[ext.PagesApi.shouldOpenSettingsPageWithCustomFilterModal]: User scripts API permission is not granted');
            return false;
        }

        return true;
    }

    /** @inheritdoc */
    // eslint-disable-next-line class-methods-use-this
    protected getBrowserSecurityParams(): { [key: string]: string } {
        return {};
    }
}
