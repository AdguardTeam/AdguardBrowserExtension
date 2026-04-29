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

import { type Config } from '../../../schema';
import { isUserScriptsApiSupported } from '../../../../common/user-scripts-api/user-scripts-api-mv3';

import { ConfigurationImportApi } from './configuration-import-api';
import { type ImportConfiguration } from './types';

export { ConfigurationImportApi } from './configuration-import-api';

/**
 * MV3 concrete implementation of {@link ConfigurationImportApi}.
 * Cookie TTL settings and browsing security are not available on MV3,
 * so the abstract apply methods are no-ops and the applicability/payload
 * helpers filter those fields out before delegating to the base class.
 */
export class ConfigurationImportApiMv3 extends ConfigurationImportApi {
    /**
     * Returns `true` only if the config contains settings applicable on MV3.
     * Cookie self-destruct TTLs and browsing security are excluded because
     * they are not supported on MV3.
     *
     * @param config Parsed {@link ImportConfiguration}.
     *
     * @returns `true` if the config has at least one MV3-applicable setting.
     */
    public override hasApplicableSettings(config: ImportConfiguration): boolean {
        const { thirdPartyCookiesMin, firstPartyCookiesMin, ...mv3Stealth } = config.stealth;

        return super.hasApplicableSettings({
            ...config,
            stealth: mv3Stealth,
            customFilters: isUserScriptsApiSupported() ? config.customFilters : [],
            browsingSecurity: undefined,
        });
    }

    /**
     * Strips cookie self-destruct TTLs and browsing security (not available on
     * MV3) from the import config before delegating to the base class.
     *
     * @param importConfig Parsed {@link ImportConfiguration}.
     *
     * @returns A fully-populated {@link Config} without MV3-unsupported fields.
     */
    public override buildConfig(importConfig: ImportConfiguration): Config {
        const { thirdPartyCookiesMin, firstPartyCookiesMin, ...mv3Stealth } = importConfig.stealth;

        return super.buildConfig({
            ...importConfig,
            stealth: mv3Stealth,
            customFilters: isUserScriptsApiSupported() ? importConfig.customFilters : [],
            browsingSecurity: undefined,
        });
    }
}

export const configurationImportApi = new ConfigurationImportApiMv3();
