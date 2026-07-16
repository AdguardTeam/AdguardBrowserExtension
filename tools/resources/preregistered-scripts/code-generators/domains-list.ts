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

import { NEWLINE_CHAR_UNIX } from '../../../../Extension/src/common/constants';
import { DOMAINS_LIST_FILENAME } from '../constants';

/**
 * Writes the domains list as an ES module to disk.
 *
 * The domains list is a simple string array of domain names that have at
 * least one blocking cosmetic rule (scriptlet or JS injection) in any of
 * the DNR rulesets.
 *
 * At runtime, the service iterates this list and queries the engine for
 * each domain to determine which rules apply.
 *
 * @param domains Array of domain strings that have rules.
 * @param outputDir Directory to write the file into.
 *
 * @returns Promise that resolves when the file has been written.
 */
export const writeDomainsList = async (
    domains: string[],
    outputDir: string,
): Promise<void> => {
    const content = [
        '// AUTO-GENERATED — do not edit manually. Re-run pnpm resources:mv3 to update.',
        `export const preregisteredDomains = ${JSON.stringify(domains, null, '\t')};`,
        '',
    ].join(NEWLINE_CHAR_UNIX);

    const outputPath = path.join(outputDir, DOMAINS_LIST_FILENAME);

    await fs.writeFile(outputPath, content, 'utf-8');
    console.log(`[generate-preregistered-domain-bundles] Wrote ${DOMAINS_LIST_FILENAME} (${domains.length} domains)`);
};
