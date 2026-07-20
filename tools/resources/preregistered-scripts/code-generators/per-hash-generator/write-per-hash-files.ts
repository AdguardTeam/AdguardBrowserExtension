/**
 * Copyright (c) 2015-2026 Adguard Software Ltd.
 *
 * @file
 * This file is part of AdGuard Browser Extension (https://github.com/AdguardTeam/AdguardBrowserExtension).
 *
 * AdGuard Browser Extension is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * AdGuard Browser Extension is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with AdGuard Browser Extension. If not, see <http://www.gnu.org/licenses/>.
 */

/* eslint-disable no-console */

import path from 'node:path';

import { SCRIPTLETS_VERSION } from '@adguard/scriptlets';

import { NEWLINE_CHAR_UNIX } from '../../../../../Extension/src/common/constants';
import { minifyJs } from '../../constants';
import { writeBundle } from '../../writeHelpers';
import { type CollectedRuleEntry } from '../../scriptlet-collector';

import { JS_RULE_GUARD_TEMPLATE } from './js-rule-guard-template';

/**
 * Explicit sentinel comments marking the extractable body inside
 * {@link JS_RULE_GUARD_TEMPLATE}. Using explicit markers (instead of locating
 * the first `{`/last `}` in the stringified function) keeps extraction
 * correct regardless of how the template's signature or surrounding code is
 * written.
 */
const BODY_START_MARKER = '// __BODY_START__';
const BODY_END_MARKER = '// __BODY_END__';

/**
 * Compiles a single scriptlet invocation file.
 *
 * Emits a call to `_ag.r(name, source, args, hash)` which delegates execution
 * to the shared scriptlets bundle loaded before this file.
 *
 * @param entry Collected rule entry for a scriptlet.
 *
 * @returns Compiled JavaScript string for the `{hash}.js` file.
 *
 * @throws When entry is missing scriptlet name or args.
 */
const compileScriptletFile = (entry: CollectedRuleEntry): string => {
    const { hash, scriptletName, scriptletArgs } = entry;

    if (!scriptletName || !scriptletArgs) {
        throw new Error(`Scriptlet entry ${hash} is missing name/args`);
    }

    const source = {
        name: scriptletName,
        args: scriptletArgs,
        engine: 'extension',
        version: SCRIPTLETS_VERSION,
        verbose: false,
    };

    const statement = `_ag.r(${JSON.stringify(scriptletName)}, ${JSON.stringify(source)}, ${JSON.stringify(scriptletArgs)}, "${hash}");`;

    return `(function () {${NEWLINE_CHAR_UNIX}${statement}${NEWLINE_CHAR_UNIX}})();${NEWLINE_CHAR_UNIX}`;
};

/**
 * Compiles a single JS injection rule file.
 *
 * Wraps the rule body with a dedup guard using `window._ag.b`
 * (defined in the shared `scriptlets-bundle.js`).
 *
 * Uses {@link JS_RULE_GUARD_TEMPLATE} — replaces `__KEY__` with the
 * rule's unique SHA-256 hash and `__CODE__` with the rule source.
 *
 * @param entry Collected rule entry for a JS rule.
 *
 * @returns Compiled JavaScript string for the `{hash}.js` file.
 *
 * @throws When entry is missing body.
 */
const compileJsRuleFile = (entry: CollectedRuleEntry): string => {
    const { hash, jsBody } = entry;

    if (!jsBody) {
        throw new Error(`JS rule entry ${hash} is missing body`);
    }

    const source = JS_RULE_GUARD_TEMPLATE.toString();
    const bodyStart = source.indexOf(BODY_START_MARKER) + BODY_START_MARKER.length;
    const bodyEnd = source.indexOf(BODY_END_MARKER);

    const body = source
        .slice(bodyStart, bodyEnd)
        .replace('__KEY__', JSON.stringify(hash))
        .replace('__CODE__', jsBody);

    return `(function () {${NEWLINE_CHAR_UNIX}${body}${NEWLINE_CHAR_UNIX}})();${NEWLINE_CHAR_UNIX}`;
};

/**
 * Writes one `{hash}.js` file per unique rule entry.
 *
 * - Scriptlet rules emit a file containing `_ag.r(...)` call.
 * - JS injection rules emit a file containing the rule body wrapped in a
 *   dedup guard.
 *
 * @param rules Map of hash → rule entry.
 * @param outputDir Directory to write files into.
 */
export const writePerHashFiles = async (
    rules: Map<string, CollectedRuleEntry>,
    outputDir: string,
): Promise<void> => {
    for (const [hash, entry] of rules) {
        let content: string;

        if (entry.scriptletName) {
            content = compileScriptletFile(entry);
        } else if (entry.jsBody) {
            content = compileJsRuleFile(entry);
        } else {
            throw new Error(`Rule entry ${hash} has neither scriptletName nor jsBody`);
        }

        content = await minifyJs(content);

        const fileName = `${hash}.js`;
        await writeBundle(content, path.join(outputDir, fileName));

        const kb = (Buffer.byteLength(content, 'utf-8') / 1024).toFixed(1);
        console.log(`[ext.writePerHashFiles]: Wrote ${fileName} (${kb} KB)`);
    }
};
