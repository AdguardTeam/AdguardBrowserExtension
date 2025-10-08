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

import { PagesApiCommon } from './pages-common';

// TODO: We can manipulates tabs directly from content-script and other extension pages context.
// So this API can be shared and used for data flow simplifying (direct calls instead of message passing)
/**
 * Pages API provides methods for managing browser pages.
 */
export class PagesApi extends PagesApiCommon {
    protected thankYouPageUrl: string = Forward.get({
        action: ForwardAction.ThankYou,
        from: ForwardFrom.Background,
    });
}
