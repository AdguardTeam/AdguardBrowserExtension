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
/* eslint-disable no-restricted-globals */

import { type Configuration } from '@adguard/tswebextension/mv3';

import { type TestDetails } from './logger';

/**
 * Creates proxy object for QUnit object to fire custom event after test run.
 */
export const addQunitListeners = (): void => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let qUnit: any;

    // eslint-disable-next-line jsdoc/require-returns, jsdoc/require-param
    /**
     * A small hack to prevent
     * the `Uncaught ReferenceError: __name is not defined` error, which occurs
     * because tsx uses esbuild under the hood and esbuild is `--keep-names`
     * option applies `__name` to functions to preserve the original name.
     *
     * See {@link https://github.com/privatenumber/tsx/issues/113}
     * and {@link https://github.com/evanw/esbuild/issues/2605#issuecomment-2050808084}.
     */
    // @ts-ignore
    window.__name = (func): unknown => func;

    Object.defineProperty(window, 'QUnit', {
        /**
         * Transparent getter.
         *
         * @returns QUnit object.
         */
        get: () => qUnit,
        /**
         * Proxy setter where we can add listeners and fire custom event
         * after test run.
         *
         * @param value QUnit object.
         */
        set: (value) => {
            qUnit = value;

            // https://api.qunitjs.com/callbacks/QUnit.on/#the-runend-event
            qUnit.on('runEnd', (details: TestDetails) => {
                const name = document.getElementById('qunit-header')?.textContent;

                const testDetails = Object.assign(details, { name });

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (<any>window).testDetails = testDetails;
            });
        },
        configurable: true,
    });
};

/**
 * Set configuration for TsWebExtension via deserialize it.
 *
 * @param configuration Configuration.
 */
export const setTsWebExtensionConfig = async (configuration: Configuration): Promise<void> => {
    if (!self.adguard.configure) {
        // eslint-disable-next-line max-len
        throw new Error(`self.adguard.configure is not found in Window object, available keys in window ${Object.keys(self)}.`);
    }

    await self.adguard.configure(configuration);
};

/**
 * Wait until extension initialized and we can start tests.
 *
 * @param eventName Event name.
 *
 * @returns Promise that resolves when extension initialized.
 */
export const waitUntilExtensionInitialized = async (eventName: string): Promise<void> => {
    return new Promise((resolve: () => void) => {
        self.addEventListener(eventName, resolve, { once: true });
    });
};
