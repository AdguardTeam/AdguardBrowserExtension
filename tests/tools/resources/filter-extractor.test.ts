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

import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import {
    describe,
    it,
    expect,
    beforeEach,
    afterEach,
} from 'vitest';

import {
    getRulesetId,
    getRulesetPath,
    InvalidMetadataChunksError,
} from '@adguard/dnr-converter';

import { extractPreprocessedFilterContent } from '../../../tools/resources/filter-extractor';
import { buildRulesetFile } from '../../helpers/dnr-ruleset-file';

const FILTER_ID = 2;

const FILTER_RULES = [
    '||example.org^',
    'example.com#%#window.__extractorTest=true;',
    '@@||example.net^',
];

/**
 * Writes ruleset content to its place inside a declarative folder.
 *
 * @param folder Declarative folder.
 * @param rulesetId Ruleset id, e.g. `ruleset_2`.
 * @param content File content.
 */
const writeRuleset = async (folder: string, rulesetId: string, content: string): Promise<void> => {
    const rulesetPath = getRulesetPath(rulesetId, folder);
    await fs.mkdir(path.dirname(rulesetPath), { recursive: true });
    await fs.writeFile(rulesetPath, content);
};

describe('extractPreprocessedFilterContent', () => {
    let folder: string;

    beforeEach(async () => {
        folder = await fs.mkdtemp(path.join(os.tmpdir(), 'filter-extractor-'));
    });

    afterEach(async () => {
        await fs.rm(folder, { recursive: true, force: true });
    });

    it('returns the filter content of a chunked ruleset file', async () => {
        const rulesetId = getRulesetId(FILTER_ID);
        await writeRuleset(folder, rulesetId, await buildRulesetFile(FILTER_ID, FILTER_RULES.join('\n')));

        const content = await extractPreprocessedFilterContent(rulesetId, folder);

        expect(content.split('\n')).toEqual(expect.arrayContaining(FILTER_RULES));
    });

    it('rejects a 1.x ruleset file with the whole metadata in the first rule', async () => {
        const rulesetId = getRulesetId(FILTER_ID);
        const legacyRuleset = [{
            id: 1,
            action: { type: 'block' },
            condition: { urlFilter: '||example.org^', resourceTypes: ['xmlhttprequest'] },
            metadata: { filterContent: FILTER_RULES.join('\n'), metadata: {}, lazyMetadata: {} },
        }];
        await writeRuleset(folder, rulesetId, JSON.stringify(legacyRuleset));

        await expect(extractPreprocessedFilterContent(rulesetId, folder))
            .rejects.toBeInstanceOf(InvalidMetadataChunksError);
    });
});
