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
import { isUserScriptsApiSupported } from '../../../../common/user-scripts-api/user-scripts-api-mv3';

import { PagesApiCommon } from './pages-common';

/**
 * Pages API provides methods for managing browser pages.
 */
export class PagesApi extends PagesApiCommon {
    /** @inheritdoc */
    // eslint-disable-next-line class-methods-use-this
    protected shouldCustomFiltersUrls(): boolean {
        return isUserScriptsApiSupported();
    }

    /** @inheritdoc */
    protected thankYouPageUrl: string = Forward.get({
        action: ForwardAction.ThankYouMv3,
        from: ForwardFrom.Background,
    });

    /** @inheritdoc */
    protected chromeExtensionStoreForwardAction: ForwardAction.ChromeStore = ForwardAction.ChromeStore;

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
