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
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
} from 'vitest';

import { EdgeMv3Migration } from '../../../../Extension/src/background/utils/edge-migration-mv3';
import { UserAgent } from '../../../../Extension/src/common/user-agent';

const originalIsEdgeMv3Build = EdgeMv3Migration.isEdgeMv3Build;
const originalIsEdge = UserAgent.isEdge;

describe.skipIf(!__IS_MV3__)('EdgeMv3Migration.isMigrationUpdate', () => {
    beforeEach(() => {
        EdgeMv3Migration.isEdgeMv3Build = true;
    });

    afterEach(() => {
        EdgeMv3Migration.isEdgeMv3Build = originalIsEdgeMv3Build;
        Object.defineProperty(UserAgent, 'isEdge', { value: originalIsEdge, configurable: true });
    });

    it('detects the update from 5.5.2 to 5.5.3 in the edge-mv3 build', () => {
        expect(EdgeMv3Migration.isMigrationUpdate('5.5.2.13', '5.5.3.0')).toBe(true);
    });

    it('detects the update from an older MV2 version', () => {
        expect(EdgeMv3Migration.isMigrationUpdate('5.5.0.5', '5.5.3.0')).toBe(true);
    });

    it('detects the update to a version above the first MV3 one', () => {
        expect(EdgeMv3Migration.isMigrationUpdate('5.5.2.13', '5.5.4.0')).toBe(true);
    });

    it('ignores an auto-build update within the first MV3 version', () => {
        expect(EdgeMv3Migration.isMigrationUpdate('5.5.3.0', '5.5.3.1')).toBe(false);
    });

    it('ignores an update between MV3 versions', () => {
        expect(EdgeMv3Migration.isMigrationUpdate('5.5.3.0', '5.5.4.0')).toBe(false);
    });

    it('ignores an update between MV2 versions', () => {
        expect(EdgeMv3Migration.isMigrationUpdate('5.5.1.0', '5.5.2.13')).toBe(false);
    });

    it('ignores the chrome-mv3 build installed in Edge from the Chrome Web Store', () => {
        EdgeMv3Migration.isEdgeMv3Build = false;
        Object.defineProperty(UserAgent, 'isEdge', { value: true, configurable: true });

        expect(EdgeMv3Migration.isMigrationUpdate('5.5.1.0', '5.5.3.0')).toBe(false);
    });
});
