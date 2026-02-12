/**
 * Copyright (c) 2015-2025 Adguard Software Ltd.
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
    it,
    expect,
    beforeEach,
    afterEach,
    vi,
} from 'vitest';

import { eventPauseController, ChangeType } from '../../../../../Extension/src/pages/services/EventPauseController-mv2';
import { NotifierType } from '../../../../../Extension/src/common/constants';
import { logger } from '../../../../../Extension/src/common/logger';

describe.skipIf(__IS_MV3__)('EventPauseController', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        eventPauseController.dispose();
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.useRealTimers();
        eventPauseController.dispose();
    });

    describe('registerPendingChange and confirmChange flow', () => {
        it('should pause events when a pending change is registered', () => {
            expect(eventPauseController.shouldProcessEvents()).toBe(true);

            eventPauseController.registerPendingChange(ChangeType.Filter, 1, true);

            expect(eventPauseController.shouldProcessEvents()).toBe(false);
        });

        it('should skip events when paused', () => {
            eventPauseController.registerPendingChange(ChangeType.Filter, 1, true);

            expect(eventPauseController.shouldSkipEvent(NotifierType.RequestFilterUpdated)).toBe(true);
            expect(eventPauseController.shouldSkipEvent(NotifierType.SettingUpdated)).toBe(true);
        });

        it('should not skip always-process events even when paused', () => {
            eventPauseController.registerPendingChange(ChangeType.Filter, 1, true);

            expect(eventPauseController.shouldSkipEvent(NotifierType.FiltersUpdateCheckReady)).toBe(false);
            expect(eventPauseController.shouldSkipEvent(NotifierType.FullscreenUserRulesEditorUpdated)).toBe(false);
        });

        it('should resume events after confirming change and debounce period', () => {
            eventPauseController.registerPendingChange(ChangeType.Filter, 1, true);
            expect(eventPauseController.shouldProcessEvents()).toBe(false);

            eventPauseController.confirmChange(ChangeType.Filter, 1, true);

            expect(eventPauseController.shouldProcessEvents()).toBe(false);

            vi.advanceTimersByTime(2000);

            expect(eventPauseController.shouldProcessEvents()).toBe(true);
        });

        it('should not confirm change if state does not match expected', () => {
            eventPauseController.registerPendingChange(ChangeType.Filter, 1, true);

            eventPauseController.confirmChange(ChangeType.Filter, 1, false);

            vi.advanceTimersByTime(2000);

            expect(eventPauseController.shouldProcessEvents()).toBe(false);
        });

        it('should handle multiple pending changes', () => {
            eventPauseController.registerPendingChange(ChangeType.Filter, 1, true);
            eventPauseController.registerPendingChange(ChangeType.Filter, 2, true);
            eventPauseController.registerPendingChange(ChangeType.Group, 3, true);

            expect(eventPauseController.shouldProcessEvents()).toBe(false);

            eventPauseController.confirmChange(ChangeType.Filter, 1, true);
            vi.advanceTimersByTime(1000);
            expect(eventPauseController.shouldProcessEvents()).toBe(false);

            eventPauseController.confirmChange(ChangeType.Filter, 2, true);
            vi.advanceTimersByTime(1000);
            expect(eventPauseController.shouldProcessEvents()).toBe(false);

            eventPauseController.confirmChange(ChangeType.Group, 3, true);
            vi.advanceTimersByTime(2000);

            expect(eventPauseController.shouldProcessEvents()).toBe(true);
        });

        it('should reset debounce timer on new pending change', () => {
            eventPauseController.registerPendingChange(ChangeType.Filter, 1, true);
            eventPauseController.confirmChange(ChangeType.Filter, 1, true);

            vi.advanceTimersByTime(1500);

            eventPauseController.registerPendingChange(ChangeType.Filter, 2, true);

            vi.advanceTimersByTime(1500);
            expect(eventPauseController.shouldProcessEvents()).toBe(false);

            eventPauseController.confirmChange(ChangeType.Filter, 2, true);
            vi.advanceTimersByTime(2000);

            expect(eventPauseController.shouldProcessEvents()).toBe(true);
        });
    });

    describe('registerPendingChange and cancelChange flow', () => {
        it('should resume events after canceling change and debounce period', () => {
            eventPauseController.registerPendingChange(ChangeType.Filter, 1, true);
            expect(eventPauseController.shouldProcessEvents()).toBe(false);

            eventPauseController.cancelChange(ChangeType.Filter, 1);

            expect(eventPauseController.shouldProcessEvents()).toBe(false);

            vi.advanceTimersByTime(2000);

            expect(eventPauseController.shouldProcessEvents()).toBe(true);
        });

        it('should handle mixed success and failure scenarios', () => {
            eventPauseController.registerPendingChange(ChangeType.Filter, 1, true);
            eventPauseController.registerPendingChange(ChangeType.Filter, 2, true);
            eventPauseController.registerPendingChange(ChangeType.Filter, 3, true);

            eventPauseController.confirmChange(ChangeType.Filter, 1, true);

            eventPauseController.cancelChange(ChangeType.Filter, 2);

            vi.advanceTimersByTime(1000);
            expect(eventPauseController.shouldProcessEvents()).toBe(false);

            eventPauseController.confirmChange(ChangeType.Filter, 3, true);

            vi.advanceTimersByTime(2000);

            expect(eventPauseController.shouldProcessEvents()).toBe(true);
        });
    });

    describe('max pause duration safety', () => {
        it('should force resume after max pause duration', () => {
            const loggerWarnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => {});

            eventPauseController.registerPendingChange(ChangeType.Filter, 1, true);

            expect(eventPauseController.shouldProcessEvents()).toBe(false);

            vi.advanceTimersByTime(10000);

            expect(eventPauseController.shouldProcessEvents()).toBe(true);
            expect(loggerWarnSpy).toHaveBeenCalledWith(
                '[ext.EventPauseController.forceResume]: Force resuming with pending changes:',
                expect.any(Array),
            );

            loggerWarnSpy.mockRestore();
        });

        it('should not warn if no pending changes on force resume', () => {
            const loggerWarnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => {});

            eventPauseController.registerPendingChange(ChangeType.Filter, 1, true);
            eventPauseController.confirmChange(ChangeType.Filter, 1, true);

            vi.advanceTimersByTime(2000);

            expect(loggerWarnSpy).not.toHaveBeenCalled();

            loggerWarnSpy.mockRestore();
        });
    });

    describe('dispose', () => {
        it('should resume events and clear all state', () => {
            eventPauseController.registerPendingChange(ChangeType.Filter, 1, true);
            eventPauseController.registerPendingChange(ChangeType.Filter, 2, true);

            expect(eventPauseController.shouldProcessEvents()).toBe(false);

            eventPauseController.dispose();

            expect(eventPauseController.shouldProcessEvents()).toBe(true);
        });

        it('should clear all timers on dispose', () => {
            eventPauseController.registerPendingChange(ChangeType.Filter, 1, true);

            const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');

            eventPauseController.dispose();

            expect(clearTimeoutSpy).toHaveBeenCalled();

            clearTimeoutSpy.mockRestore();
        });
    });

    describe('edge cases', () => {
        it('should handle registering same change multiple times', () => {
            eventPauseController.registerPendingChange(ChangeType.Filter, 1, true);
            eventPauseController.registerPendingChange(ChangeType.Filter, 1, true);

            eventPauseController.confirmChange(ChangeType.Filter, 1, true);

            vi.advanceTimersByTime(2000);

            expect(eventPauseController.shouldProcessEvents()).toBe(true);
        });

        it('should handle confirming non-existent change', () => {
            eventPauseController.registerPendingChange(ChangeType.Filter, 1, true);

            eventPauseController.confirmChange(ChangeType.Filter, 999, true);

            vi.advanceTimersByTime(2000);

            expect(eventPauseController.shouldProcessEvents()).toBe(false);
        });

        it('should handle canceling non-existent change', () => {
            eventPauseController.registerPendingChange(ChangeType.Filter, 1, true);

            eventPauseController.cancelChange(ChangeType.Filter, 999);

            vi.advanceTimersByTime(2000);

            expect(eventPauseController.shouldProcessEvents()).toBe(false);
        });

        it('should distinguish between filter and group changes with same id', () => {
            eventPauseController.registerPendingChange(ChangeType.Filter, 1, true);
            eventPauseController.registerPendingChange(ChangeType.Group, 1, true);

            eventPauseController.confirmChange(ChangeType.Filter, 1, true);

            vi.advanceTimersByTime(2000);
            expect(eventPauseController.shouldProcessEvents()).toBe(false);

            eventPauseController.confirmChange(ChangeType.Group, 1, true);

            vi.advanceTimersByTime(2000);

            expect(eventPauseController.shouldProcessEvents()).toBe(true);
        });
    });
});
