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

/* eslint-disable no-console */

import { promises as fs } from 'node:fs';
import path from 'node:path';

import {
    FILTERS_DEST,
    PREREGISTERED_SCRIPTS_DIR,
    DECLARATIVE_FILTERS_DEST,
    type Mv3AssetsFiltersBrowser,
} from '../../constants';

import { preregisteredDomains } from './config';
import { FilterCollector } from './filter-collector';
import { writeRegistry } from './registry';
import { writeSharedBundle } from './shared-bundle-generator';
import { writeDomainBundles } from './domain-bundle-generator';

/**
 * Generates preregistered-script bundles and registry for a target MV3 browser.
 */
export const generatePreregisteredDomainBundles = async (
    browser: Mv3AssetsFiltersBrowser,
): Promise<void> => {
    const filtersFolder = FILTERS_DEST.replace('%browser', browser);
    const outputDir = path.join(filtersFolder, PREREGISTERED_SCRIPTS_DIR);
    const declarativeFolder = DECLARATIVE_FILTERS_DEST.replace('%browser', browser);

    await fs.mkdir(outputDir, { recursive: true });

    // Clean stale bundles
    const existing = await fs.readdir(outputDir);
    await Promise.all(existing.map((f) => fs.unlink(path.join(outputDir, f))));

    // 1. Collect rules
    const collector = new FilterCollector(preregisteredDomains, declarativeFolder);
    const { domainRules, domainScriptlets, scriptletNames } = await collector.collect();

    // 2. build bundles and write them to disk
    await writeSharedBundle(scriptletNames, outputDir);
    await writeDomainBundles(domainRules, domainScriptlets, outputDir);
    await writeRegistry(domainRules, domainScriptlets, outputDir);
};
