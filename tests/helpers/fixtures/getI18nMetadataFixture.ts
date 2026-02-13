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

import i18nMetadataMv2 from '../../../Extension/filters/chromium/filters_i18n.json';
// eslint-disable-next-line no-restricted-imports
import i18nMetadataMv3 from '../../../Extension/filters/chromium-mv3/filters_i18n.json';
import { i18nMetadataValidator, type I18nMetadata } from '../../../Extension/src/background/schema';

export const getI18nMetadataFixture = (): I18nMetadata => {
    const i18nMetadata = __IS_MV3__ ? i18nMetadataMv3 : i18nMetadataMv2;

    return i18nMetadataValidator.parse(i18nMetadata);
};
