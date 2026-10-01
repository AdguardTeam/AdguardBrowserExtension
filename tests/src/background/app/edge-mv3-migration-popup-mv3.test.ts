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
    vi,
} from 'vitest';

import { toasts } from '../../../../Extension/src/background/api/ui/toasts';
import { settingsStorage } from '../../../../Extension/src/background/storages';
import { EdgeMv3Migration } from '../../../../Extension/src/background/utils/edge-migration-mv3';

vi.mock('../../../../Extension/src/background/api/ui/toasts');

const originalIsEdgeMv3Build = EdgeMv3Migration.isEdgeMv3Build;

/**
 * Creates a test subclass that exposes the update handler.
 *
 * @returns Test app class with a public update handler runner.
 */
const createTestApp = async () => {
    const { App } = await import('../../../../Extension/src/background/app');

    class TestApp extends App {
        /**
         * Runs the update handler without the full app startup.
         *
         * @param currentAppVersion Current extension version.
         * @param previousAppVersion Previous extension version.
         *
         * @returns Promise that resolves after the update is handled.
         */
        public static runHandleUpdate(currentAppVersion: string, previousAppVersion: string): Promise<void> {
            return this.handleUpdate(currentAppVersion, previousAppVersion);
        }
    }

    return TestApp;
};

describe.skipIf(!__IS_MV3__)('Update popup after the Edge MV2 to MV3 migration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(settingsStorage, 'get').mockReturnValue(false);
    });

    afterEach(() => {
        EdgeMv3Migration.isEdgeMv3Build = originalIsEdgeMv3Build;
        vi.restoreAllMocks();
    });

    it('shows the migration popup instead of the update popup in the edge-mv3 build', async () => {
        EdgeMv3Migration.isEdgeMv3Build = true;
        const TestApp = await createTestApp();

        await TestApp.runHandleUpdate('5.5.3.0', '5.5.2.13');

        expect(toasts.showEdgeMv3MigrationPopup).toHaveBeenCalledOnce();
        expect(toasts.showApplicationUpdatedPopup).not.toHaveBeenCalled();
    });

    it('shows nothing when update notifications are disabled', async () => {
        EdgeMv3Migration.isEdgeMv3Build = true;
        vi.spyOn(settingsStorage, 'get').mockReturnValue(true);
        const TestApp = await createTestApp();

        await TestApp.runHandleUpdate('5.5.3.0', '5.5.2.13');

        expect(toasts.showEdgeMv3MigrationPopup).not.toHaveBeenCalled();
        expect(toasts.showApplicationUpdatedPopup).not.toHaveBeenCalled();
    });

    it('shows the update popup for a later MV3 update in the edge-mv3 build', async () => {
        EdgeMv3Migration.isEdgeMv3Build = true;
        const TestApp = await createTestApp();

        await TestApp.runHandleUpdate('5.6.0.0', '5.5.3.0');

        expect(toasts.showEdgeMv3MigrationPopup).not.toHaveBeenCalled();
        expect(toasts.showApplicationUpdatedPopup).toHaveBeenCalledWith('5.6.0.0', '5.5.3.0');
    });

    it('shows the update popup in other MV3 builds', async () => {
        EdgeMv3Migration.isEdgeMv3Build = false;
        const TestApp = await createTestApp();

        await TestApp.runHandleUpdate('5.5.3.0', '5.5.2.13');

        expect(toasts.showEdgeMv3MigrationPopup).not.toHaveBeenCalled();
        expect(toasts.showApplicationUpdatedPopup).toHaveBeenCalledWith('5.5.3.0', '5.5.2.13');
    });
});
