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

import { CanvasRegistrationStatus, type RegistrationResult } from 'tswebextension';

import { logger } from '../../../common/logger';

/**
 * Engine call that returned a canvas protection registration result.
 */
export enum CanvasProtectionResultSource {
    Start = 'start',
    Configure = 'configure',
    SetEnabled = 'setCanvasProtectionEnabled',
}

/**
 * Reports the engine's canvas protection registration results.
 */
export class CanvasProtectionApi {
    /**
     * Logs the registration result when it reports a problem.
     *
     * Results of {@link CanvasRegistrationStatus.Installed} and
     * {@link CanvasRegistrationStatus.Disabled} are expected and are not
     * logged. A failed registration is logged as an error, other results,
     * e.g. a missing permission, as info.
     *
     * @param source Engine call that returned the result.
     * @param result Registration result returned by the engine, or `undefined`
     * when the engine did not report it.
     */
    public static logResult(
        source: CanvasProtectionResultSource,
        result: RegistrationResult | undefined,
    ): void {
        if (!result) {
            return;
        }

        if (
            result.status === CanvasRegistrationStatus.Installed
            || result.status === CanvasRegistrationStatus.Disabled
        ) {
            return;
        }

        if (result.status === CanvasRegistrationStatus.Failed) {
            logger.error(`[ext.CanvasProtectionApi.logResult]: canvas protection is not applied by ${source}: status: ${result.status}, reason: ${result.reason}`);
            return;
        }

        logger.info(`[ext.CanvasProtectionApi.logResult]: canvas protection is not applied by ${source}: status: ${result.status}, reason: ${result.reason}`);
    }
}
