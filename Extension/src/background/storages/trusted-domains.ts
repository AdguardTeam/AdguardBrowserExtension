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
import { TRUSTED_DOCUMENTS_CACHE_KEY } from '../../common/constants';
import { TrustedDomainData } from '../schema';
import { StringStorage } from '../utils/string-storage';
import { storage } from './main';

/**
 * {@link StringStorage} instance, that stores
 * {@link TrustedDomainData} list in {@link storage} under
 * {@link TRUSTED_DOCUMENTS_CACHE_KEY} key
 */
export const trustedDomainsStorage = new StringStorage<
    typeof TRUSTED_DOCUMENTS_CACHE_KEY,
    TrustedDomainData[],
    'async'
>(TRUSTED_DOCUMENTS_CACHE_KEY, storage);
