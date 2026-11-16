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
    type MockInstance,
} from 'vitest';

import { CanvasRegistrationStatus, type RegistrationResult } from '@adguard/tswebextension';

import { CanvasProtectionApi, CanvasProtectionResultSource } from '../../../../../Extension/src/background/api';
import { logger } from '../../../../../Extension/src/common/logger';

describe('CanvasProtectionApi', () => {
    describe('logResult', () => {
        const source = CanvasProtectionResultSource.Start;
        const reason = 'user scripts are not allowed';
        const requiredUserAction = 'Allow user scripts';

        let loggerInfoSpy: MockInstance;
        let loggerErrorSpy: MockInstance;

        beforeEach(() => {
            loggerInfoSpy = vi.spyOn(logger, 'info').mockImplementation(() => {});
            loggerErrorSpy = vi.spyOn(logger, 'error').mockImplementation(() => {});
        });

        afterEach(() => {
            loggerInfoSpy.mockRestore();
            loggerErrorSpy.mockRestore();
        });

        it('logs an unavailable result as info with its status and reason', () => {
            CanvasProtectionApi.logResult(source, {
                status: CanvasRegistrationStatus.Unavailable,
                reason,
                requiredUserAction,
            } as RegistrationResult);

            expect(loggerInfoSpy).toHaveBeenCalledTimes(1);
            expect(loggerErrorSpy).not.toHaveBeenCalled();

            const message = loggerInfoSpy.mock.calls[0]?.[0] as string;

            expect(message).toContain(source);
            expect(message).toContain(CanvasRegistrationStatus.Unavailable);
            expect(message).toContain(reason);
        });

        it('logs a failed result as error with its status and reason', () => {
            CanvasProtectionApi.logResult(source, {
                status: CanvasRegistrationStatus.Failed,
                reason,
            } as RegistrationResult);

            expect(loggerErrorSpy).toHaveBeenCalledTimes(1);
            expect(loggerInfoSpy).not.toHaveBeenCalled();

            const message = loggerErrorSpy.mock.calls[0]?.[0] as string;

            expect(message).toContain(source);
            expect(message).toContain(CanvasRegistrationStatus.Failed);
            expect(message).toContain(reason);
        });

        it('does not log an installed result', () => {
            CanvasProtectionApi.logResult(source, {
                status: CanvasRegistrationStatus.Installed,
            } as RegistrationResult);

            expect(loggerInfoSpy).not.toHaveBeenCalled();
            expect(loggerErrorSpy).not.toHaveBeenCalled();
        });

        it('does not log a disabled result', () => {
            CanvasProtectionApi.logResult(source, {
                status: CanvasRegistrationStatus.Disabled,
            } as RegistrationResult);

            expect(loggerInfoSpy).not.toHaveBeenCalled();
            expect(loggerErrorSpy).not.toHaveBeenCalled();
        });

        it('does not log a missing result', () => {
            CanvasProtectionApi.logResult(source, undefined);

            expect(loggerInfoSpy).not.toHaveBeenCalled();
            expect(loggerErrorSpy).not.toHaveBeenCalled();
        });
    });
});
