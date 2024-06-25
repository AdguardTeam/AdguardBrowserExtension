import metadata from '../../../Extension/filters/chromium/filters.json';
import { metadataValidator, type Metadata } from '../../../Extension/src/background/schema';

export const getMetadataFixture = (): Metadata => metadataValidator.parse(metadata);
