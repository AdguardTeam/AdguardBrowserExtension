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

/**
 * Merges two vitest JUnit XML reports (MV2 + MV3) into a single output file.
 *
 * Background: unit tests run twice — once for MV2 and once for MV3.  Tests
 * annotated with `describe.skipIf(__IS_MV3__)` are covered by the MV2 run
 * but skipped (or absent) in the MV3 report, and vice-versa for MV3-only
 * tests.  When Bamboo ingests two XML files it picks the "worst" result per
 * test name, so those tests surface as skipped even though they are fully
 * covered.
 *
 * This script resolves the issue by producing a **single** output file:
 * - Tests present in only one file are included as-is.
 * - Tests present in both files: the passing version is kept.
 * - Tests that are skipped in both files: reported as errors; exit code 1.
 *
 * Usage: tsx tools/merge-junit.ts <mv2.xml> <mv3.xml> <out.xml>
 */

/* eslint-disable no-console */

import { readFileSync, writeFileSync } from 'node:fs';

const TESTCASE_RE = /<testcase\b[^>]*>[\s\S]*?<\/testcase>/g;
const SKIPPED_RE = /<skipped[\s/>]/;

/**
 * Extracts a named attribute value from a fragment of XML text.
 *
 * @param xml Fragment of XML text.
 * @param name Attribute name to look up.
 *
 * @returns The attribute value, or an empty string if absent.
 */
const getAttributeValue = (xml: string, name: string): string => {
    const m = xml.match(new RegExp(`\\b${name}="([^"]*)"`));
    return m ? m[1]! : '';
};

/**
 * Collects all `<testcase>` blocks from a JUnit XML string.
 *
 * @param xml Raw XML content.
 *
 * @returns Map of `classname::name` → `{ block, passing }`.
 */
const collectTestcases = (xml: string): Map<string, { block: string; passing: boolean }> => {
    const map = new Map<string, { block: string; passing: boolean }>();
    for (const match of xml.matchAll(TESTCASE_RE)) {
        const block = match[0]!;
        const key = `${getAttributeValue(block, 'classname')}::${getAttributeValue(block, 'name')}`;
        const passing = !SKIPPED_RE.test(block);
        // Within a single file a test should not appear twice, but if it does
        // prefer the passing version.
        if (!map.has(key) || passing) {
            map.set(key, { block, passing });
        }
    }
    return map;
};

const [file1, file2, outFile] = process.argv.slice(2);

if (!file1 || !file2 || !outFile) {
    console.error('Usage: tsx tools/merge-junit.ts <mv2.xml> <mv3.xml> <out.xml>');
    process.exit(1);
}

const tests1 = collectTestcases(readFileSync(file1, 'utf8'));
const tests2 = collectTestcases(readFileSync(file2, 'utf8'));

const merged = new Map<string, string>();
const uncovered: string[] = [];

for (const key of new Set([...tests1.keys(), ...tests2.keys()])) {
    const t1 = tests1.get(key);
    const t2 = tests2.get(key);
    const selectedTest = (t1?.passing ? t1 : undefined) ?? (t2?.passing ? t2 : undefined);
    if (selectedTest) {
        merged.set(key, selectedTest.block);
    } else {
        uncovered.push(key);
    }
}

if (uncovered.length > 0) {
    console.error(`[merge-junit] ${uncovered.length} test(s) have no passing version in either file:`);
    uncovered.forEach((k) => console.error(`  - ${k}`));
    process.exit(1);
}

// Group testcases by classname to preserve testsuite structure in the output.
const suites = new Map<string, string[]>();
for (const [key, block] of merged) {
    const classname = key.split('::')[0]!;
    if (!suites.has(classname)) {
        suites.set(classname, []);
    }
    suites.get(classname)!.push(block.trim());
}

const suiteXml = [...suites.entries()]
    .map(([name, cases]) => [
        `  <testsuite name="${name}" tests="${cases.length}">`,
        ...cases.map((c) => `    ${c}`),
        '  </testsuite>',
    ].join('\n'))
    .join('\n');

const xml = `<?xml version="1.0" encoding="UTF-8" ?>\n<testsuites tests="${merged.size}">\n${suiteXml}\n</testsuites>\n`;

writeFileSync(outFile, xml, 'utf8');
console.log(`[merge-junit] Merged ${merged.size} test(s) from ${file1} + ${file2} → ${outFile}`);
