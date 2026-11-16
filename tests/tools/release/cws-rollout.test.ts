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

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
    describe,
    expect,
    it,
} from 'vitest';

import {
    CWS_ROLLOUT_BODY_PREFIX,
    DEFAULT_CWS_ROLLOUT_PERCENTAGE,
    appendCwsRolloutMarker,
    formatCwsRolloutMarker,
    parseCwsRolloutBodyLine,
    parseCwsRolloutPercentage,
    renderCwsRolloutOutputs,
    resolveCwsRollout,
} from '../../../tools/release/cws-rollout';

describe('parseCwsRolloutPercentage', () => {
    it('parses an integer percentage', () => {
        expect(parseCwsRolloutPercentage('5')).toBe(5);
        expect(parseCwsRolloutPercentage('1')).toBe(1);
        expect(parseCwsRolloutPercentage('100')).toBe(100);
    });

    it('trims surrounding whitespace', () => {
        expect(parseCwsRolloutPercentage(' 7 ')).toBe(7);
    });

    it('returns the default for an empty or missing value', () => {
        expect(parseCwsRolloutPercentage('')).toBe(DEFAULT_CWS_ROLLOUT_PERCENTAGE);
        expect(parseCwsRolloutPercentage('   ')).toBe(DEFAULT_CWS_ROLLOUT_PERCENTAGE);
        expect(parseCwsRolloutPercentage(undefined)).toBe(DEFAULT_CWS_ROLLOUT_PERCENTAGE);
    });

    it('rejects a value outside 1-100', () => {
        expect(() => parseCwsRolloutPercentage('0')).toThrow();
        expect(() => parseCwsRolloutPercentage('101')).toThrow();
        expect(() => parseCwsRolloutPercentage('-1')).toThrow();
    });

    it('rejects a value that is not an integer', () => {
        expect(() => parseCwsRolloutPercentage('5.5')).toThrow();
        expect(() => parseCwsRolloutPercentage('abc')).toThrow();
        expect(() => parseCwsRolloutPercentage('5%')).toThrow();
    });

    it('rejects a value with leading zeros', () => {
        expect(() => parseCwsRolloutPercentage('007')).toThrow();
        expect(() => parseCwsRolloutPercentage('05')).toThrow();
    });
});

describe('parseCwsRolloutBodyLine', () => {
    it('parses the rollout line', () => {
        expect(parseCwsRolloutBodyLine(`${CWS_ROLLOUT_BODY_PREFIX} 5%`)).toBe(5);
        expect(parseCwsRolloutBodyLine(`Release v5.6.0\n\n${CWS_ROLLOUT_BODY_PREFIX} 12%\n`)).toBe(12);
    });

    it('returns undefined when the line is absent', () => {
        expect(parseCwsRolloutBodyLine(undefined)).toBeUndefined();
        expect(parseCwsRolloutBodyLine('')).toBeUndefined();
        expect(parseCwsRolloutBodyLine('Release v5.6.0\n\nMerging this PR triggers publish.')).toBeUndefined();
    });

    it('ignores a percentage on a line without the prefix', () => {
        expect(parseCwsRolloutBodyLine('Rollout: 5%')).toBeUndefined();
    });

    it('throws when the line has no percentage value', () => {
        expect(() => parseCwsRolloutBodyLine(`${CWS_ROLLOUT_BODY_PREFIX} 5`)).toThrow();
        expect(() => parseCwsRolloutBodyLine(`${CWS_ROLLOUT_BODY_PREFIX} abc%`)).toThrow();
        expect(() => parseCwsRolloutBodyLine(`${CWS_ROLLOUT_BODY_PREFIX} 0%`)).toThrow();
        expect(() => parseCwsRolloutBodyLine(`${CWS_ROLLOUT_BODY_PREFIX} 500%`)).toThrow();
    });

    it('returns the first value when the line appears twice', () => {
        const body = `${CWS_ROLLOUT_BODY_PREFIX} 5%\n${CWS_ROLLOUT_BODY_PREFIX} 50%`;

        expect(parseCwsRolloutBodyLine(body)).toBe(5);
    });
});

describe('resolveCwsRollout', () => {
    it('gives the beta channel no percentage regardless of the input', () => {
        expect(resolveCwsRollout({
            channel: 'beta',
            prBody: `${CWS_ROLLOUT_BODY_PREFIX} 50%`,
            input: '50',
        })).toEqual({ percentage: '' });
    });

    it('gives an empty or unknown channel no percentage', () => {
        for (const channel of ['', 'stable']) {
            expect(resolveCwsRollout({
                channel,
                prBody: `${CWS_ROLLOUT_BODY_PREFIX} 50%`,
                input: '50',
            })).toEqual({ percentage: '' });
        }
    });

    it('uses the default for the release channel when no value is provided', () => {
        expect(resolveCwsRollout({
            channel: 'release',
            prBody: undefined,
            input: undefined,
        })).toEqual({ percentage: String(DEFAULT_CWS_ROLLOUT_PERCENTAGE) });
    });

    it('uses the release-bump PR body value', () => {
        expect(resolveCwsRollout({
            channel: 'release',
            prBody: `${CWS_ROLLOUT_BODY_PREFIX} 10%`,
            input: undefined,
        })).toEqual({ percentage: '10' });
    });

    it('prefers the dispatch input over the PR body value', () => {
        expect(resolveCwsRollout({
            channel: 'release',
            prBody: `${CWS_ROLLOUT_BODY_PREFIX} 10%`,
            input: '20',
        })).toEqual({ percentage: '20' });
    });

    it('rejects an invalid input', () => {
        for (const input of ['0', '101']) {
            expect(() => resolveCwsRollout({
                channel: 'release',
                prBody: undefined,
                input,
            })).toThrow();
        }
    });

    it('uses the default with a warning when the PR body line is malformed', () => {
        for (const line of [`${CWS_ROLLOUT_BODY_PREFIX} 5`, `${CWS_ROLLOUT_BODY_PREFIX} 0%`]) {
            expect(resolveCwsRollout({
                channel: 'release',
                prBody: line,
                input: undefined,
            })).toEqual({
                percentage: String(DEFAULT_CWS_ROLLOUT_PERCENTAGE),
                warning: expect.stringContaining('using the default'),
            });
        }
    });

    it('prefers a valid dispatch input over a malformed PR body line', () => {
        expect(resolveCwsRollout({
            channel: 'release',
            prBody: `${CWS_ROLLOUT_BODY_PREFIX} 5`,
            input: '20',
        })).toEqual({ percentage: '20' });
    });
});

describe('formatCwsRolloutMarker', () => {
    it('formats the marker line', () => {
        expect(formatCwsRolloutMarker(1)).toBe('Chrome Web Store rollout: 1%');
    });
});

describe('appendCwsRolloutMarker', () => {
    it('appends the marker line to the output file', () => {
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cws-rollout-'));
        const outputFile = path.join(dir, 'output');

        fs.writeFileSync(outputFile, 'version=5.6.0\n');
        appendCwsRolloutMarker(outputFile, 7);

        expect(fs.readFileSync(outputFile, 'utf8'))
            .toBe('version=5.6.0\nrollout-marker=Chrome Web Store rollout: 7%\n');
        fs.rmSync(dir, { recursive: true, force: true });
    });

    it('does nothing without an output file', () => {
        expect(() => appendCwsRolloutMarker(undefined, 7)).not.toThrow();
    });
});

describe('renderCwsRolloutOutputs', () => {
    it('renders an empty percentage', () => {
        expect(renderCwsRolloutOutputs({ percentage: '' })).toBe('rollout-percentage=');
    });

    it('renders a percentage', () => {
        expect(renderCwsRolloutOutputs({ percentage: '10' })).toBe('rollout-percentage=10');
    });
});
