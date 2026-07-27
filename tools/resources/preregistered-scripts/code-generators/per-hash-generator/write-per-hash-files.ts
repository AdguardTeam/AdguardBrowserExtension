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
import { SimpleRegex } from '@adguard/tsurlfilter';

import { NEWLINE_CHAR_UNIX } from '../../../../../Extension/src/common/constants';
import { minifyJs } from '../../constants';
import { writeBundle, assertNoTemplateSentinels } from '../../writeHelpers';
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
 * Emits a call to `coordinationKey.r(name, source, args, hash)` — a bare
 * reference to the top-level `let` binding declared by the shared bundle
 * (see `shared-bundle-template.js`), which delegates execution to it.
 *
 * `source.domainName` is omitted — `.r` fills it in at runtime from
 * `document.location.hostname`. `source.verbose` is hardcoded to `false`;
 * debug scriptlet output isn't available on preregistered domains since
 * `debugScriptlets` lives in `chrome.storage`, unreachable from MAIN world.
 *
 * @param entry Collected rule entry for a scriptlet.
 * @param coordinationKey Random per-build identifier (see
 * `coordination-key.ts`), matching the one declared by the shared bundle.
 *
 * @returns Compiled JavaScript string for the `{hash}.js` file.
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
        // See @note above: overwritten at runtime by `.r`.
        verbose: false,
    };

    const statement = `${coordinationKey}.r(${JSON.stringify(scriptletName)}, ${JSON.stringify(source)}, ${JSON.stringify(scriptletArgs)}, "${hash}");`;

    return `(function () {${NEWLINE_CHAR_UNIX}${statement}${NEWLINE_CHAR_UNIX}})();${NEWLINE_CHAR_UNIX}`;
};

/**
 * Compiles a single JS injection rule file.
 *
 * Wraps the rule body with a dedup guard using `coordinationKey.b` (defined
 * in the shared `scriptlets-bundle.js`, a bare top-level `let` reference,
 * not a `window` property).
 *
 * Uses {@link JS_RULE_GUARD_TEMPLATE} — replaces `__KEY__` with the
 * rule's unique SHA-256 hash, `__CODE__` with the rule source, and `__PROP__`
 * with the coordination key identifier.
 *
 * @param entry Collected rule entry for a JS rule.
 * @param coordinationKey Random per-build identifier (see
 * `coordination-key.ts`), matching the one declared by the shared bundle.
 *
 * @returns Compiled JavaScript string for the `{hash}.js` file.
 *
 * @throws When entry is missing body.
 */
const compileJsRuleFile = (entry: CollectedRuleEntry, coordinationKey: string): string => {
    const { hash, jsBody } = entry;

    if (!jsBody) {
        throw new Error(`JS rule entry ${hash} is missing body`);
    }

    const source = JS_RULE_GUARD_TEMPLATE.toString();
    const bodyStart = source.indexOf(BODY_START_MARKER) + BODY_START_MARKER.length;
    const bodyEnd = source.indexOf(BODY_END_MARKER);

    const body = source
        .slice(bodyStart, bodyEnd)
        .replace('__KEY__', () => JSON.stringify(hash))
        .replace('__CODE__', () => jsBody)
        .replace('__PROP__', () => coordinationKey);

    assertNoTemplateSentinels(body, ['__KEY__', '__CODE__', '__PROP__']);

    return `(function () {${NEWLINE_CHAR_UNIX}${body}${NEWLINE_CHAR_UNIX}})();${NEWLINE_CHAR_UNIX}`;
};

/**
 * Converts a `$path` pattern into a regex, the same way tsurlfilter's
 * `Pattern` class does internally ({@link SimpleRegex.patternToRegexp}).
 * Can't reuse `Pattern` directly here since the result is embedded as a
 * runtime guard in a file that runs in the page's MAIN world, not Node.js.
 *
 * @param pathPattern Raw `$path` modifier pattern text
 * (`rule.pathModifier.pattern`).
 *
 * @returns Regex source and flags for `new RegExp(source, flags)`.
 */
const getPathPatternRegex = (pathPattern: string): { source: string; flags: string } => {
    if (pathPattern === '') {
        return { source: '^/$', flags: '' };
    }

    return {
        source: SimpleRegex.patternToRegexp(pathPattern),
        flags: 'i',
    };
};

/**
 * Wraps compiled rule content with a runtime `$path` guard, so it only runs
 * when `location.pathname` matches the rule's path pattern. Rules are
 * collected regardless of path (see {@link ScriptletCollector}) — this is
 * where that condition is finally enforced, in the browser.
 *
 * @param content Compiled rule content (from {@link compileScriptletFile} or
 * {@link compileJsRuleFile}).
 * @param pathPattern Raw `$path` modifier pattern text
 * (`rule.pathModifier.pattern`).
 *
 * @returns `content` wrapped in an `if (...)` guard.
 */
const wrapWithPathGuard = (content: string, pathPattern: string): string => {
    const { source, flags } = getPathPatternRegex(pathPattern);
    const condition = `new RegExp(${JSON.stringify(source)}, ${JSON.stringify(flags)}).test(location.pathname)`;

    return `if (${condition}) {${NEWLINE_CHAR_UNIX}${content}}${NEWLINE_CHAR_UNIX}`;
};

/**
 * Writes one `{hash}.js` file per unique rule entry.
 *
 * - Scriptlet rules emit a file containing a `coordinationKey.r(...)` call.
 * - JS injection rules emit a file containing the rule body wrapped in a
 *   dedup guard.
 * - Rules with a `$path` modifier are additionally wrapped in a runtime path
 *   guard (see {@link wrapWithPathGuard}).
 *
 * @param rules Map of hash → rule entry.
 * @param outputDir Directory to write files into.
 * @param coordinationKey Random per-build identifier (see
 * `coordination-key.ts`), matching the one declared by the shared bundle.
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

        const fileName = `${hash}.js`;
        await writeBundle(content, path.join(outputDir, fileName));

        const kb = (Buffer.byteLength(content, 'utf-8') / 1024).toFixed(1);
        console.log(`[ext.writePerHashFiles]: Wrote ${fileName} (${kb} KB)`);
    }
};
