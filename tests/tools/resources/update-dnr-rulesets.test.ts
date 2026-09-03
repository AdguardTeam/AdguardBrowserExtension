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

import {
    describe,
    expect,
    it,
} from 'vitest';

import { rewriteDnrRulesetsTarballUrls } from '../../../tools/resources/update-dnr-rulesets';

const NPM_REGISTRY = 'https://registry.npmjs.org';
const AK_REGISTRY = 'https://ak.internal.example/npm/npm-internal';
const NPM_TARBALL_BASE = `${NPM_REGISTRY}/@adguard/dnr-rulesets/-/`;
const AK_TARBALL_BASE = `${AK_REGISTRY}/@adguard/dnr-rulesets/-/`;

describe('rewriteDnrRulesetsTarballUrls', () => {
    it('rewrites Artifact Keeper tarball URLs back to the npm registry', () => {
        const lockfile = [
            'packages:',
            '',
            '  \'@adguard/dnr-rulesets@5.0.20260901001712\':',
            `    resolution: {integrity: sha512-aaa, tarball: ${AK_TARBALL_BASE}dnr-rulesets-5.0.20260901001712.tgz}`,
            '',
        ].join('\n');

        const result = rewriteDnrRulesetsTarballUrls(lockfile, AK_REGISTRY);

        expect(result).toContain(`${NPM_TARBALL_BASE}dnr-rulesets-5.0.20260901001712.tgz`);
        expect(result).not.toContain('ak.internal.example');
        expect(result).toContain('integrity: sha512-aaa');
    });

    it('rewrites transitive dependencies resolved from Artifact Keeper too', () => {
        // `pnpm add --registry <AK>` resolves the whole dependency tree from AK,
        // so transitive deps (here @adguard/agtree and @adguard/dnr-converter)
        // keep an AK tarball URL that must also point at npm for frozen
        // installs outside the reach of AK.
        const lockfile = [
            '  \'@adguard/agtree@4.2.1\':',
            `    resolution: {integrity: sha512-bbb, tarball: ${AK_REGISTRY}/@adguard/agtree/-/agtree-4.2.1.tgz}`,
            '  \'@adguard/dnr-converter@1.1.2\':',
            `    resolution: {integrity: sha512-ccc, tarball: ${AK_REGISTRY}/@adguard/dnr-converter/-/dnr-converter-1.1.2.tgz}`,
        ].join('\n');

        const result = rewriteDnrRulesetsTarballUrls(lockfile, AK_REGISTRY);

        expect(result).toContain(`${NPM_REGISTRY}/@adguard/agtree/-/agtree-4.2.1.tgz`);
        expect(result).toContain(`${NPM_REGISTRY}/@adguard/dnr-converter/-/dnr-converter-1.1.2.tgz`);
        expect(result).not.toContain('ak.internal.example');
    });

    it('leaves npm registry URLs untouched (idempotent)', () => {
        const lockfile = `    resolution: {integrity: sha512-ddd, tarball: ${NPM_TARBALL_BASE}dnr-rulesets-5.0.20260901001712.tgz}`;

        expect(rewriteDnrRulesetsTarballUrls(lockfile, AK_REGISTRY)).toBe(lockfile);
    });

    it('leaves entries without a tarball URL untouched', () => {
        const lockfile = '    resolution: {integrity: sha512-eee}';

        expect(rewriteDnrRulesetsTarballUrls(lockfile, AK_REGISTRY)).toBe(lockfile);
    });

    it('does not touch URLs from other registries', () => {
        const lockfile = '    resolution: {integrity: sha512-fff, tarball: https://other.registry.example/@adguard/tsurlfilter/-/tsurlfilter-6.0.3.tgz}';

        expect(rewriteDnrRulesetsTarballUrls(lockfile, AK_REGISTRY)).toBe(lockfile);
    });

    it('rewrites every occurrence', () => {
        const lockfile = [
            `a: {tarball: ${AK_TARBALL_BASE}dnr-rulesets-5.0.1.tgz}`,
            `b: {tarball: ${AK_TARBALL_BASE}dnr-rulesets-5.0.2.tgz}`,
        ].join('\n');

        const result = rewriteDnrRulesetsTarballUrls(lockfile, AK_REGISTRY);

        expect(result.match(/registry\.npmjs\.org/g)).toHaveLength(2);
    });
});
