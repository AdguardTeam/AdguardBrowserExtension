import metadataMv2 from '../../../Extension/filters/chromium/filters.json';
import metadataMv3 from '../../../Extension/filters/chromium-mv3/filters.json';
import { metadataValidator, type Metadata } from '../../../Extension/src/background/schema';

const getMetadataMv2Fixture = (): Metadata => metadataValidator.parse(metadataMv2);
const getMetadataMv3Fixture = (): Metadata => metadataValidator.parse(metadataMv3);

export const getMetadataFixture = __IS_MV3__
    ? getMetadataMv3Fixture
    : getMetadataMv2Fixture;
