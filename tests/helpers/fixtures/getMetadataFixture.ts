import metadataMv2 from '../../../Extension/filters/chromium/filters.json';
import metadataMv3 from '../../../Extension/filters/chromium-mv3/filters.json';
import { metadataValidator, Metadata } from '../../../Extension/src/background/schema';

export const getMetadataFixture = (): Metadata => {
    const metadata = __IS_MV3__ ? metadataMv3 : metadataMv2;

    return metadataValidator.parse(metadata);
};
