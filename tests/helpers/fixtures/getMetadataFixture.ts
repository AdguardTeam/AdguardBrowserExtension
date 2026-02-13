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

import { readFileSync } from 'fs';
import path from 'path';

import { METADATA_RULESET_ID, MetadataRuleSet } from '@adguard/tsurlfilter/es/declarative-converter';
import { getRuleSetPath } from '@adguard/tsurlfilter/es/declarative-converter-utils';

import metadataMv2 from '../../../Extension/filters/chromium/filters.json';
import { metadataValidator, type Metadata } from '../../../Extension/src/background/schema';

// eslint-disable-next-line @typescript-eslint/naming-convention
const __dirname = path.dirname(new URL(import.meta.url).pathname);

const metadataRuleSetPath = path.join(
    __dirname,
    getRuleSetPath(METADATA_RULESET_ID, '../../../Extension/filters/chromium-mv3/declarative'),
);

export const getMetadataFixture = (): Metadata => {
    let metadata: unknown;

    if (__IS_MV3__) {
        const rawMetadataRuleSet = readFileSync(metadataRuleSetPath, 'utf8');
        const metadataRuleSet = MetadataRuleSet.deserialize(rawMetadataRuleSet);
        const filtersMetadata = metadataRuleSet.getAdditionalProperty('metadata') || {};
        metadata = {
            version: metadataRuleSet.getAdditionalProperty('version'),
            versionTimestampMs: metadataRuleSet.getAdditionalProperty('versionTimestampMs'),
            ...filtersMetadata,
        };
    } else {
        metadata = metadataMv2;
    }

    return metadataValidator.parse(metadata);
};
