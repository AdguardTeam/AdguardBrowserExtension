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

import { readFileSync } from 'fs';
import path from 'path';

import {
    MetadataRuleset,
    METADATA_RULESET_ID,
    getRulesetPath,
} from '@adguard/dnr-converter';

import metadataMv2 from '../../../Extension/filters/chromium/filters.json';
import { metadataValidator, type Metadata } from '../../../Extension/src/background/schema';

// eslint-disable-next-line @typescript-eslint/naming-convention
const __dirname = path.dirname(new URL(import.meta.url).pathname);

const metadataRulesetPath = path.join(
    __dirname,
    getRulesetPath(METADATA_RULESET_ID, '../../../Extension/filters/chromium-mv3/declarative'),
);

export const getMetadataFixture = (): Metadata => {
    let metadata: unknown;

    if (__IS_MV3__) {
        const rawJson = readFileSync(metadataRulesetPath, 'utf8');
        const metadataRuleset = MetadataRuleset.deserialize(rawJson);

        const filtersMetadata = metadataRuleset.getAdditionalProperty('metadata') || {};
        metadata = {
            version: metadataRuleset.getAdditionalProperty('version'),
            versionTimestampMs: metadataRuleset.getAdditionalProperty('versionTimestampMs'),
            ...filtersMetadata,
        };
    } else {
        metadata = metadataMv2;
    }

    return metadataValidator.parse(metadata);
};
