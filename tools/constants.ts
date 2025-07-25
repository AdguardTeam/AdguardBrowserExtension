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
    Edge = 'edge',
}

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

export const LOCAL_SCRIPT_RULES_COMMENT_CHROME_MV3 = `To fully comply with Chrome Web Store policies regarding remote code execution,
we implement a strict security-focused approach for Scriptlet and JavaScript rules execution.

1. Default - regular users that did not grant User scripts API permission explicitly:
   - We collect and pre-build script rules from the filters and statically bundle
     them into the extension - STEP 1. See 'updateLocalResourcesForChromiumMv3' in our build tools.
     IMPORTANT: all scripts and their arguments are local and bundled within the extension.
   - These pre-verified local scripts are passed to the engine - STEP 2.
   - At runtime before the execution, we check if each script rule is included
     in our local scripts list (STEP 3).
   - Only pre-verified local scripts are executed via chrome.scripting API (STEP 4.1 and 4.2).
     All other scripts are discarded.
   - Custom filters are NOT allowed for regular users to prevent any possibility
     of remote code execution, regardless of rule interpretation.

2. For advanced users that explicitly granted User scripts API permission -
   via enabling the Developer mode or Allow user scripts in the extension details:
   - Custom filters are allowed and may contain Scriptlet and JS rules
     that can be executed using the browser's built-in userScripts API (STEP 4.3),
     which provides a secure sandbox.
   - This execution bypasses the local script verification process but remains
     isolated and secure through Chrome's native sandboxing.
   - This mode requires explicit user activation and is intended for advanced users only.

IMPORTANT:
Custom filters are ONLY supported when User scripts API permission is explicitly enabled.
This strict policy prevents Chrome Web Store rejection due to potential remote script execution.
When custom filters are allowed, they may contain:
1. Network rules – converted to DNR rules and applied via dynamic rules.
2. Cosmetic rules – interpreted directly in the extension code.
3. Scriptlet and JS rules – executed via the browser's userScripts API (userScripts.execute)
   with Chrome's native sandboxing providing security isolation.
For regular users without User scripts API permission (default case):
- Only pre-bundled filters with statically verified scripts are supported.
- Downloading custom filters or any rules from remote sources is blocked entirely
   to ensure compliance with the store policies.

This implementation ensures perfect compliance with Chrome Web Store policies
by preventing any possibility of remote code execution for regular users.

It is possible to follow all places using this logic by searching JS_RULES_EXECUTION.`;

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
