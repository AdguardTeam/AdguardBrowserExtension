/**
 * !IMPORTANT!
 * './filtering-log.__ABSTRACT_BROWSERS__' is replaced during webpack compilation
 * with NormalModuleReplacementPlugin to proper browser implementation
 * './filtering-log.firefox' or './filtering-log.chrome'
 */

import filteringLog from './filtering-log.__ABSTRACT_API__';

export { filteringLog };
