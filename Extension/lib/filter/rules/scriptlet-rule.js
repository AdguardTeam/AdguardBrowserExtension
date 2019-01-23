/**
 * This file is part of Adguard Browser Extension (https://github.com/AdguardTeam/AdguardBrowserExtension).
 *
 * Adguard Browser Extension is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Adguard Browser Extension is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with Adguard Browser Extension.  If not, see <http://www.gnu.org/licenses/>.
 */

(function (adguard, api) {

    'use strict';

    /**
     * Parse scriptlet data from script text and return
     * @param {string} script text of script
     */
    function getScriptletData(script) {
        const match = /\/\/(\s*)scriptlet\(([^\)]+)\)/g.exec(script);
        const params = match[2]
            .trim()
            .replace(/['"]/g, '')
            .split(/[,|,\s*]/)
            .filter(i => i);
        const name = params.shift();
        const args = params.slice();

        return {
            name: name,
            args: args,
            aliases: [
                'ubo' + name + '.js',
                'abp' + name
            ],
        }
    }

    /**
     * JS injection rule:
     * http://adguard.com/en/filterrules.html#javascriptInjection
     */
    const ScriptletRule = function (rule, filterId) {
        this.scriptlet = getScriptletData(rule);
    };

    ScriptletRule.prototype = Object.create(api.FilterRule.prototype);

    
    /**
     * Check is script includes `scriptlet` tag
     */
    ScriptletRule.prototype.isScriptletFilterRule = function(text) {
        return text && /\/\/(\s*)scriptlet\(([^\)]+)\)/g.test(text);
    }

    api.ScriptletRule = ScriptletRule;

})(adguard, adguard.rules);

