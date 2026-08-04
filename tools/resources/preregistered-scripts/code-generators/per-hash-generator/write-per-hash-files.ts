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
import { getRuleFilename } from '@adguard/tswebextension/mv3/preregistered-scripts/hasher';

import { NEWLINE_CHAR_UNIX } from '../../../../../Extension/src/common/constants';
import { minifyJs } from '../../constants';
import {
    writeBundle,
    assertNoTemplateSentinels,
    extractTemplateBody,
} from '../../write-helpers';
import { type CollectedRuleEntry } from '../../scriptlet-collector';

import { JS_RULE_GUARD_TEMPLATE } from './js-rule-guard-template';
import { getPathTest } from './path-pattern';

/**
 * Compiles a single scriptlet invocation file: a call to
 * `coordinationKey.r(name, source, args, hash)` — a bare reference to the
 * `window` property declared by the shared bundle.
 *
 * `source.domainName` is filled by `.r` at runtime; `verbose` is hardcoded
 * `false` (`debugScriptlets` lives in `chrome.storage`, unreachable from
 * MAIN world).
 *
 * @param entry Collected rule entry for a scriptlet.
 * @param coordinationKey Identifier declared by the shared bundle.
 *
 * @returns Compiled JavaScript string for the rule file.
 *
 * @throws When entry is missing scriptlet name or args.
 */
const compileScriptletFile = (entry: CollectedRuleEntry, coordinationKey: string): string => {
    const { hash, scriptletName, scriptletArgs } = entry;

    if (!scriptletName || !scriptletArgs) {
        throw new Error(`Scriptlet entry ${hash} is missing name/args`);
    }

    const source = {
        name: scriptletName,
        args: scriptletArgs,
        engine: 'extension',
        version: SCRIPTLETS_VERSION,
        // Overwritten at runtime by `.r`.
        verbose: false,
    };

    const statement = `${coordinationKey}.r(${JSON.stringify(scriptletName)}, ${JSON.stringify(source)}, ${JSON.stringify(scriptletArgs)}, "${hash}");`;

    return `(function () {${NEWLINE_CHAR_UNIX}try {${NEWLINE_CHAR_UNIX}${statement}${NEWLINE_CHAR_UNIX}} catch (e) {}${NEWLINE_CHAR_UNIX}})();${NEWLINE_CHAR_UNIX}`;
};

/**
 * Compiles a single JS injection rule file: the rule body wrapped in a
 * dedup guard referencing `coordinationKey.b` from the shared bundle.
 * Replaces `__KEY__` (rule hash), `__CODE__` (rule source) and `__PROP__`
 * (coordination key identifier) in {@link JS_RULE_GUARD_TEMPLATE}.
 *
 * @param entry Collected rule entry for a JS rule.
 * @param coordinationKey Identifier declared by the shared bundle.
 *
 * @returns Compiled JavaScript string for the rule file.
 *
 * @throws When entry is missing body or the guard template markers are gone.
 */
const compileJsRuleFile = (entry: CollectedRuleEntry, coordinationKey: string): string => {
    const { hash, jsBody } = entry;

    if (!jsBody) {
        throw new Error(`JS rule entry ${hash} is missing body`);
    }

    const body = extractTemplateBody(JS_RULE_GUARD_TEMPLATE)
        .replace('__KEY__', () => JSON.stringify(hash))
        .replace('__CODE__', () => jsBody)
        .replace('__PROP__', () => coordinationKey);

    assertNoTemplateSentinels(body, ['__KEY__', '__CODE__', '__PROP__']);

    return `{${NEWLINE_CHAR_UNIX}${body}${NEWLINE_CHAR_UNIX}}${NEWLINE_CHAR_UNIX}`;
};

/**
 * Wraps compiled rule content with a runtime `$path` guard, so it only runs
 * when the page URL's path + query + hash matches the rule's path pattern.
 *
 * @param content Compiled rule content (from {@link compileScriptletFile} or
 * {@link compileJsRuleFile}).
 * @param pathPattern Raw `$path` modifier pattern text
 * (`rule.pathModifier.pattern`).
 *
 * @returns `content` wrapped in an `if (...)` guard.
 */
const wrapWithPathGuard = (content: string, pathPattern: string): string => {
    const condition = getPathTest(pathPattern);

    return `if (${condition}) {${NEWLINE_CHAR_UNIX}${content}}${NEWLINE_CHAR_UNIX}`;
};

/**
 * Writes one `{hash}.js` file per unique rule entry: a
 * `coordinationKey.r(...)` call for scriptlets, a dedup-guarded body for JS
 * rules, optionally wrapped in a runtime `$path` guard.
 *
 * @param rules Map of hash → rule entry.
 * @param outputDir Directory to write files into.
 * @param coordinationKey Identifier declared by the shared bundle.
 */
export const writePerHashFiles = async (
    rules: Map<string, CollectedRuleEntry>,
    outputDir: string,
    coordinationKey: string,
): Promise<void> => {
    for (const [hash, entry] of rules) {
        let content: string;

        if (entry.scriptletName) {
            content = compileScriptletFile(entry, coordinationKey);
        } else if (entry.jsBody) {
            content = compileJsRuleFile(entry, coordinationKey);
        } else {
            throw new Error(`Rule entry ${hash} has neither scriptletName nor jsBody`);
        }

        if (entry.pathPattern !== undefined) {
            content = wrapWithPathGuard(content, entry.pathPattern);
        }

        content = await minifyJs(content);

        const fileName = getRuleFilename(hash);
        await writeBundle(content, path.join(outputDir, fileName));

        const kb = (Buffer.byteLength(content, 'utf-8') / 1024).toFixed(1);
        console.log(`[ext.writePerHashFiles]: Wrote ${fileName} (${kb} KB)`);
    }
};
