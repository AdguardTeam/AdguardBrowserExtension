/**
 * !IMPORTANT!
 * './content-filtering.__ABSTRACT_BROWSERS__' is replaced during webpack compilation
 * with NormalModuleReplacementPlugin to proper browser implementation
 * './content-filtering.firefox' or './content-filtering.chrome'
 */

import contentFiltering from './content-filtering.__ABSTRACT_BROWSERS__';

export { contentFiltering };
