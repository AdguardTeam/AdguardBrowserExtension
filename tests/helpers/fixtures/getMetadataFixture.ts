import { readFileSync } from 'fs';
import path from 'path';

import { METADATA_RULESET_ID, MetadataRuleSet } from '@adguard/tsurlfilter/es/declarative-converter';
import { getRuleSetPath } from '@adguard/tsurlfilter/es/declarative-converter-utils';

import metadataMv2 from '../../../Extension/filters/chromium/filters.json';
import { metadataValidator, Metadata } from '../../../Extension/src/background/schema';

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
        metadata = metadataRuleSet.getAdditionalProperty('metadata');
    } else {
        metadata = metadataMv2;
    }

    return metadataValidator.parse(metadata);
};
