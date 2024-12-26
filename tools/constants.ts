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

import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { REMOTE_METADATA_FILE_NAME, REMOTE_I18N_METADATA_FILE_NAME } from '../constants';

/* eslint-disable @typescript-eslint/naming-convention */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
/* eslint-enable @typescript-eslint/naming-convention */

/**
 * Environment types for build target.
 */
export enum BuildTargetEnv {
    Dev = 'dev',
    Beta = 'beta',
    Release = 'release',
}

/**
 * Environment types for manifest version.
 */
export enum ManifestVersionEnv {
    Second = '2',
    Third = '3',
}

const isValidBuildEnv = (buildEnv: any): buildEnv is BuildTargetEnv => {
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

export const enum Browser {
    Chrome = 'chrome',
    ChromeMv3 = 'chrome-mv3',
    FirefoxAmo = 'firefox-amo',
    FirefoxStandalone = 'firefox-standalone',
    Opera = 'opera',
    Edge = 'edge',
}

/**
 * List of browsers which has its own filters assets directory.
 */
export const enum AssetsFiltersBrowser {
    Chromium = 'chromium',
    ChromiumMv3 = 'chromium-mv3',
    Edge = 'edge',
    Firefox = 'firefox',
    Opera = 'opera',
}

export const FIREFOX_APP_IDS_MAP: Record<BuildTargetEnv, string> = {
    [BuildTargetEnv.Dev]: 'adguardadblockerdev@adguard.com',
    [BuildTargetEnv.Beta]: 'adguardadblockerbeta@adguard.com',
    [BuildTargetEnv.Release]: 'adguardadblocker@adguard.com',
};

export const BUILD_PATH = path.resolve(__dirname, '../build');

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

// FIXME (Slava) (in another PR): update the url after the merge
export const LOCAL_SCRIPT_RULES_COMMENT_CHROME_MV3 = `By the rules of Chrome Web Store, we cannot use remote scripts (and our JS rules can be counted as such).
   Because of that, we use the following approach
   (you can search the described steps by 'JS_RULES_EXECUTION' in the bundled background.js):

1. We collect and pre-build JS rules from the filters (which are pre-built into the extension)
   into the add-on (step 1). See 'updateLocalScriptRulesForChromiumMv3' in
   https://github.com/AdguardTeam/AdguardBrowserExtension/blob/fix/AG-38557-001/tools/resources/update-local-script-rules.ts
   and the file called "local_script_rules.js".
2. Collected local script rules are passed to the engine (step 2.1 and 2.2).
3. At runtime we check every JS rule whether it is included in "local_script_rules.js" (step 3).
4. Execution of JS rules:
    - If the rule is included, we allow this rule to work since it is pre-built.
      Such rules are executed by chrome.scripting API (step 4.1). Other rules are discarded.
    - If the rule is added manually by the user (rules from "User rules" and "Custom filters"),
      we allow it to work as well. This way filters maintainers can test new rules before including them in the filters.
      Such rules are executed by script tag injection (step 4.2) as they are local because they were added by the user.`;

// artifacts constants
export const CHROME_UPDATE_URL = 'https://static.adtidy.org/extensions/adguardadblocker/beta/update.xml';
export const CHROME_CERT = path.resolve(__dirname, '../private/AdguardBrowserExtension/certificate.pem');
export const CHROME_CODEBASE_URL = 'https://static.adtidy.org/extensions/adguardadblocker/beta/chrome.crx';
export const FIREFOX_UPDATE_TEMPLATE = path.resolve(__dirname, './bundle/firefox/update_template.json');
export const FIREFOX_WEBEXT_UPDATE_URL = 'https://static.adtidy.org/extensions/adguardadblocker/beta/update.json';
