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
import { SettingOption } from '../../../schema';
import { settingsStorage } from '../../../storages';

import { PagesApiCommon } from './pages-common';

/**
 * Pages API provides methods for managing browser pages.
 */
export class PagesApi extends PagesApiCommon {
    /** @inheritdoc */
    // eslint-disable-next-line class-methods-use-this
    protected shouldCustomFiltersUrls(): boolean {
        return true;
    }

    /** @inheritdoc */
    protected thankYouPageUrl: string = Forward.get({
        action: ForwardAction.ThankYou,
        from: ForwardFrom.Background,
    });

    /** @inheritdoc */
    protected chromeExtensionStoreForwardAction: ForwardAction.ChromeMv2Store = ForwardAction.ChromeMv2Store;

    /** @inheritdoc */
    // eslint-disable-next-line class-methods-use-this
    protected shouldOpenSettingsPageWithCustomFilterModal(): boolean {
        return true;
    }

    /** @inheritdoc */
    // eslint-disable-next-line class-methods-use-this
    protected getBrowserSecurityParams(): { [key: string]: string } {
        const isEnabled = !settingsStorage.get(SettingOption.DisableSafebrowsing);
        return { 'browsing_security.enabled': String(isEnabled) };
    }
}
