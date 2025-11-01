import i18nMetadataMv2 from '../../../Extension/filters/chromium/filters_i18n.json';
// eslint-disable-next-line no-restricted-imports
import i18nMetadataMv3 from '../../../Extension/filters/chromium-mv3/filters_i18n.json';
import { i18nMetadataValidator, type I18nMetadata } from '../../../Extension/src/background/schema';

export const getI18nMetadataFixture = (): I18nMetadata => {
    const i18nMetadata = __IS_MV3__ ? i18nMetadataMv3 : i18nMetadataMv2;

    return i18nMetadataValidator.parse(i18nMetadata);
};
