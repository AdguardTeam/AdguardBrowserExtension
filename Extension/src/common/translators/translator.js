import { translate } from '@adguard/translate';
import { i18n } from './i18n';

/**
 * Retrieves localised message by key, formats it and converts into string
 */
export const translator = translate.createTranslator(i18n);
