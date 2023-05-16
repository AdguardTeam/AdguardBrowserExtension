import i18nMetadata from '../../../Extension/filters/chromium/filters_i18n.json';
import { i18nMetadataValidator, I18nMetadata } from '../../../Extension/src/background/schema';

export const getI18nMetadataFixture = (): I18nMetadata => i18nMetadataValidator.parse(i18nMetadata);
