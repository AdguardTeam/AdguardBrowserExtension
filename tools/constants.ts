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

import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { BrowserFilters } from '@adguard/dnr-rulesets';

import {
    REMOTE_METADATA_FILE_NAME,
    REMOTE_I18N_METADATA_FILE_NAME,
    BuildTargetEnv,
} from '../constants';

/* eslint-disable @typescript-eslint/naming-convention */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
/* eslint-enable @typescript-eslint/naming-convention */

/**
 * Environment types for manifest version.
 */
export enum ManifestVersionEnv {
    Second = '2',
    Third = '3',
}

export const isValidBuildEnv = (buildEnv: any): buildEnv is BuildTargetEnv => {
    return Object.values(BuildTargetEnv).includes(buildEnv as BuildTargetEnv);
};

export const BUILD_ENV = process.env.BUILD_ENV as BuildTargetEnv || BuildTargetEnv.Dev;

// By default we use the third version of the manifest.
export const MANIFEST_ENV = process.env.MANIFEST_ENV as ManifestVersionEnv || ManifestVersionEnv.Third;

if (!isValidBuildEnv(BUILD_ENV)) {
    throw new Error(`Invalid BUILD_ENV: ${BUILD_ENV}`);
}

export type EnvConfig = {
    outputPath: string;
    mode: 'development' | 'production';
};

export const ENV_CONF: Record<BuildTargetEnv, EnvConfig> = {
    [BuildTargetEnv.Dev]: {
        outputPath: 'dev',
        mode: 'development',
    },
    [BuildTargetEnv.Beta]: {
        outputPath: 'beta',
        mode: 'production',
    },
    [BuildTargetEnv.Release]: {
        outputPath: 'release',
        mode: 'production',
    },
};

export enum Browser {
    Chrome = 'chrome',
    ChromeMv3 = 'chrome-mv3',
    /**
     * CRX build of Chrome MV2 for mobile testing.
     */
    ChromeCrx = 'chrome-crx',
    FirefoxAmo = 'firefox-amo',
    FirefoxStandalone = 'firefox-standalone',
    Opera = 'opera',
    OperaMv3 = 'opera-mv3',
    Edge = 'edge',
}

/**
 * List of {@link Browser} values that are MV3 extension.
 */
export const MV3_BROWSERS = [
    Browser.ChromeMv3,
    Browser.OperaMv3,
] as const;

/**
 * Infered type for {@link MV3_BROWSERS}.
 */
export type Mv3Browser = (typeof MV3_BROWSERS)[number];

/**
 * Map of {@link Mv3Browser} to {@link BrowserFilters}.
 */
export const MV3_BROWSER_TO_DNR_BROWSER_MAP: Record<Mv3Browser, BrowserFilters> = {
    [Browser.ChromeMv3]: BrowserFilters.ChromiumMv3,
    [Browser.OperaMv3]: BrowserFilters.OperaMv3,
};

export const isValidBrowserTarget = (target: any): target is Browser => {
    return Object.values(Browser).includes(target as Browser);
};

/**
 * List of browsers which has its own filters assets directory.
 */
export const enum AssetsFiltersBrowser {
    Chromium = 'chromium',
    ChromiumMv3 = 'chromium-mv3',
    Edge = 'edge',
    Firefox = 'firefox',
    Opera = 'opera',
    OperaMv3 = 'opera-mv3',
}

/**
 * List of {@link AssetsFiltersBrowser} values that are MV3 extension.
 */
export const MV3_ASSETS_FILTERS_BROWSERS = [
    AssetsFiltersBrowser.ChromiumMv3,
    AssetsFiltersBrowser.OperaMv3,
] as const;

/**
 * Infered type for {@link MV3_ASSETS_FILTERS_BROWSERS}.
 */
export type Mv3AssetsFiltersBrowser = (typeof MV3_ASSETS_FILTERS_BROWSERS)[number];

/**
 * Map of {@link Mv3AssetsFiltersBrowser} to {@link BrowserFilters}.
 */
export const MV3_ASSETS_FILTERS_BROWSER_TO_DNR_BROWSER_MAP: Record<Mv3AssetsFiltersBrowser, BrowserFilters> = {
    [AssetsFiltersBrowser.ChromiumMv3]: BrowserFilters.ChromiumMv3,
    [AssetsFiltersBrowser.OperaMv3]: BrowserFilters.OperaMv3,
};

export const FIREFOX_APP_IDS_MAP: Record<BuildTargetEnv, string> = {
    [BuildTargetEnv.Dev]: 'adguardadblockerdev@adguard.com',
    [BuildTargetEnv.Beta]: 'adguardadblockerbeta@adguard.com',
    [BuildTargetEnv.Release]: 'adguardadblocker@adguard.com',
};

export const BUILD_PATH = path.resolve(__dirname, '../build');

export const ANALYZE_REPORTS_DIR = path.resolve(__dirname, '../build/analyze-reports');

/* eslint-disable max-len */
// filters constants
export const EXTENSION_FILTERS_SERVER_URL_FORMAT = 'https://filters.adtidy.org/extension/%browser';
export const METADATA_DOWNLOAD_URL_FORMAT = `${EXTENSION_FILTERS_SERVER_URL_FORMAT}/${REMOTE_METADATA_FILE_NAME}`;
export const FILTERS_DEST = 'Extension/filters/%browser';
export const DECLARATIVE_FILTERS_DEST = 'Extension/filters/%browser/declarative';
export const METADATA_I18N_DOWNLOAD_URL_FORMAT = `${EXTENSION_FILTERS_SERVER_URL_FORMAT}/${REMOTE_I18N_METADATA_FILE_NAME}`;
export const FILTER_DOWNLOAD_URL_FORMAT = `${EXTENSION_FILTERS_SERVER_URL_FORMAT}/filters/%filter.txt`;
export const OPTIMIZED_FILTER_DOWNLOAD_URL_FORMAT = `${EXTENSION_FILTERS_SERVER_URL_FORMAT}/filters/%s_optimized.txt`;
export const LOCAL_SCRIPT_RULES_COMMENT = `By the rules of AMO, we cannot use remote scripts (and our JS rules can be counted as such).
Because of that, we use the following approach (that was accepted by AMO reviewers):

1. We pre-build JS rules from AdGuard filters into the add-on (see the file called "local_script_rules.json").
2. At runtime we check every JS rule if it is included into "local_script_rules.json".
   If it is included we allow this rule to work since it is pre-built. Other rules are discarded.
3. We also allow "User rules" and "Custom filters" to work since those rules are added manually by the user.
   This way filters maintainers can test new rules before including them in the filters.`;

export const LOCAL_SCRIPT_RULES_COMMENT_CHROME_MV3 = `Search for 'JS_RULES_EXECUTION' to find all parts of script execution
process in the extension.

1. We collect and bundle all scripts that can be executed on web pages into
    the extension package into so-called \`localScriptRules\`.
2. Rules that control when and where these scripts can be executed are also
    bundled within the extension package inside ruleset files.
3. The rules look like: \`example.org#%#scripttext\`. Whenever the rule is
    matched, we check if there's a function for scripttext in
    \`localScriptRules\`, retrieve it from there and execute it.

Below is the file with all the registered scripts that can be executed.`;

// artifacts constants
export const UPDATE_BASE_URL = 'https://static.adtidy.org/extensions/adguardadblocker/beta';

export const CHROME_UPDATE_FILE_NAME = 'update.xml';
export const CHROME_UPDATE_URL = `${UPDATE_BASE_URL}/${CHROME_UPDATE_FILE_NAME}`;

export const CHROME_CERT = path.resolve(__dirname, '../private/AdguardBrowserExtension/certificate.pem');
export const CHROME_CERT_DEV = path.resolve(__dirname, '../tests/test-certificate.pem');

export const CHROME_CODEBASE_FILE_NAME = 'chrome.crx';
export const CHROME_CODEBASE_URL = `${UPDATE_BASE_URL}/${CHROME_CODEBASE_FILE_NAME}`;

export const FIREFOX_UPDATE_TEMPLATE = path.resolve(__dirname, './bundle/firefox/update_template.json');
export const FIREFOX_WEBEXT_UPDATE_FILE_NAME = 'update.json';
export const FIREFOX_WEBEXT_UPDATE_URL = `${UPDATE_BASE_URL}/${FIREFOX_WEBEXT_UPDATE_FILE_NAME}`;
