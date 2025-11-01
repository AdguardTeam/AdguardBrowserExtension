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

import { FiltersApiCommon } from './main-common';

/**
 * API for managing filters data. This class is a facade for working with
 * filters, for example, its methods are called by the handlers of user actions:
 * enabling or disabling a filter or filter group, updating, etc. It depends on
 * CommonFilterApi and CustomFilterApi.
 *
 * In MV2, the FiltersApi class remains as-is from the common implementation.
 */
export class FiltersApi extends FiltersApiCommon {}
