import React from 'react';
import translator from '../../common/translator/translator';

/**
 * Retrieves localised messages by key, formats and converts into react components or string
 */
const translate = translator.createReactTranslator(React);

export const reactTranslator = {
    translate,
};
