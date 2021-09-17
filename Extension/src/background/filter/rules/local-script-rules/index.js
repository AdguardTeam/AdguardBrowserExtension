/**
 * !IMPORTANT!
 * './local-script-rules.__ABSTRACT_BROWSERS__' is replaced during webpack compilation
 * with NormalModuleReplacementPlugin to proper browser implementation
 * './local-script-rules.firefox' or './local-script-rules.chrome'
 */

import localScriptRulesService from './local-script-rules.__ABSTRACT_BROWSERS__';

export { localScriptRulesService };
