/**
 * Copyright (c) 2015-2026 Adguard Software Ltd.
 *
 * @file Shared E2E helpers for custom filter download tests: UI flow,
 * extension storage reads and extension messaging.
 *
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

import { SettingOption } from '../../../Extension/src/background/schema/settings/enum';
import {
    FILTER_CONTENT_STORAGE_KEY,
    FILTER_STORAGE_KEY_COMBINER,
    IDB_STORAGE_NAME,
    IDB_STORAGE_VERSION,
    IDB_STORE_NAME,
} from '../../../Extension/src/background/storages/constants';
import { ADGUARD_SETTINGS_KEY } from '../../../Extension/src/common/constants';
import { type E2EPageHandle } from '../../../tools/browser-test/e2e/page-handle';

import {
    OPTIONS_PAGE_READY_SELECTOR,
    POLL_INTERVAL_MS,
    SELECTOR_WAIT_TIMEOUT_MS,
} from './user-rules-helpers';

/**
 * Selector for the URL/name input inside the add-custom-filter modal.
 */
export const ADD_CUSTOM_FILTER_INPUT_SELECTOR = '.add-custom-input__input';

/**
 * Arguments that point {@link readCustomFilters} at the settings storage.
 */
export const READ_CUSTOM_FILTERS_ARGS = {
    settingsKey: ADGUARD_SETTINGS_KEY,
    customFiltersKey: SettingOption.CustomFilters,
};

/**
 * Custom filter metadata stored by the extension.
 */
export type E2ECustomFilterMetadata = {
    /**
     * Filter identifier.
     */
    filterId: number;

    /**
     * Custom filter subscription URL.
     */
    customUrl: string;

    /**
     * Filter display name.
     */
    name: string;
};

/**
 * State of the add-custom-filter modal.
 */
export type E2EAddCustomModalState = 'checking' | 'approve' | 'error';

/**
 * Result of adding a custom filter through the UI.
 */
export type E2EAddedCustomFilter = {
    /**
     * Stored custom filter metadata.
     */
    filter: E2ECustomFilterMetadata;

    /**
     * Rules count shown on the approve step, or NaN if the count was not found.
     */
    rulesCount: number;
};

/**
 * Polls a value until it satisfies a predicate.
 *
 * @param readValue Value reader.
 * @param predicate Predicate that marks the value as ready.
 * @param timeoutMs Maximum wait time in milliseconds.
 *
 * @returns The last read value.
 *
 * @throws Error if the value does not satisfy the predicate before the timeout.
 */
export const waitForValue = async <T>(
    readValue: () => Promise<T>,
    predicate: (value: T) => boolean,
    timeoutMs = SELECTOR_WAIT_TIMEOUT_MS,
): Promise<T> => {
    const startedAt = Date.now();
    let value = await readValue();

    while (!predicate(value)) {
        if (Date.now() - startedAt >= timeoutMs) {
            throw new Error(`Condition was not met within ${timeoutMs}ms. Last value: ${JSON.stringify(value)}`);
        }

        await new Promise<void>((resolve) => {
            setTimeout(resolve, POLL_INTERVAL_MS);
        });
        value = await readValue();
    }

    return value;
};

/**
 * Browser-context: sets the location hash.
 *
 * @param arg Hash to set.
 */
export const setLocationHash = (arg: unknown): void => {
    window.location.hash = arg as string;
};

/**
 * Browser-context: reads an input value.
 *
 * @param arg CSS selector.
 *
 * @returns Input value or an empty string.
 */
export const readInputValue = (arg: unknown): string => {
    const input = document.querySelector<HTMLInputElement>(arg as string);

    return input?.value ?? '';
};

/**
 * Browser-context: clicks the first enabled button with the given text.
 *
 * @param arg Button text.
 *
 * @returns True if the button was found and clicked.
 */
export const clickButtonByText = (arg: unknown): boolean => {
    const text = arg as string;
    const root = document.querySelector('.ReactModal__Content') ?? document;
    const button = Array.from(root.querySelectorAll<HTMLButtonElement>('button'))
        .find((candidate) => !candidate.disabled && candidate.textContent?.trim() === text);

    if (!button) {
        return false;
    }

    button.click();

    return true;
};

/**
 * Browser-context: reads the current add-custom-filter modal state.
 *
 * @returns Modal state.
 */
export const readModalState = (): E2EAddCustomModalState => {
    const modal = document.querySelector('.ReactModal__Content');

    if (!modal) {
        return 'checking';
    }

    if (modal.querySelector('[role="alert"]')) {
        return 'error';
    }

    const buttons = Array.from(modal.querySelectorAll<HTMLButtonElement>('button'));

    if (buttons.some((button) => button.textContent?.trim() === 'Add')) {
        return 'approve';
    }

    if (buttons.some((button) => button.textContent?.trim() === 'Try again')) {
        return 'error';
    }

    return 'checking';
};

/**
 * Browser-context: reads the add-custom-filter modal text.
 *
 * @returns Modal text.
 */
export const readModalText = (): string => {
    const modal = document.querySelector<HTMLElement>('.ReactModal__Content');

    return modal?.innerText ?? '';
};

/**
 * Arguments for {@link readCustomFilters}.
 */
type ReadCustomFiltersArgs = {
    /**
     * Key of the extension settings object in `chrome.storage.local`.
     */
    settingsKey: string;

    /**
     * Key of the custom filter metadata inside the settings object.
     */
    customFiltersKey: string;
};

/**
 * Browser-context: reads custom filter metadata from extension storage.
 *
 * @param arg Storage keys.
 *
 * @returns Custom filter metadata.
 *
 * @throws Error if the settings or custom filters value is missing or invalid.
 */
export const readCustomFilters = async (arg: unknown): Promise<E2ECustomFilterMetadata[]> => {
    const { settingsKey, customFiltersKey } = arg as ReadCustomFiltersArgs;
    const stored = await new Promise<Record<string, unknown>>((resolve, reject) => {
        chrome.storage.local.get(settingsKey, (items) => {
            const runtimeError = chrome.runtime.lastError;

            if (runtimeError) {
                reject(new Error(runtimeError.message));
                return;
            }

            resolve(items);
        });
    });

    const settings = stored[settingsKey];

    if (!settings || typeof settings !== 'object') {
        throw new Error(`Missing ${settingsKey} in extension storage`);
    }

    const raw = (settings as Record<string, unknown>)[customFiltersKey];

    if (typeof raw !== 'string') {
        throw new Error(`Missing ${customFiltersKey} in ${settingsKey}`);
    }

    return JSON.parse(raw) as E2ECustomFilterMetadata[];
};

/**
 * Arguments for {@link readIndexedDbValue}.
 */
type ReadIndexedDbValueArgs = {
    /**
     * IndexedDB database name.
     */
    dbName: string;

    /**
     * IndexedDB database version.
     */
    version: number;

    /**
     * IndexedDB store name.
     */
    storeName: string;

    /**
     * Storage key.
     */
    key: string;
};

/**
 * Browser-context: reads a value from the extension IndexedDB storage.
 *
 * @param arg Database, store and key.
 *
 * @returns Stored string value or undefined.
 */
export const readIndexedDbValue = async (arg: unknown): Promise<string | undefined> => {
    const {
        dbName,
        version,
        storeName,
        key,
    } = arg as ReadIndexedDbValueArgs;
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open(dbName, version);

        request.onupgradeneeded = (): void => {
            if (!request.result.objectStoreNames.contains(storeName)) {
                request.result.createObjectStore(storeName);
            }
        };
        request.onsuccess = (): void => resolve(request.result);
        request.onerror = (): void => reject(request.error);
    });

    try {
        const value = await new Promise<unknown>((resolve, reject) => {
            const transaction = db.transaction(storeName, 'readonly');
            const request = transaction.objectStore(storeName).get(key);

            request.onsuccess = (): void => resolve(request.result);
            request.onerror = (): void => reject(request.error);
        });

        return typeof value === 'string' ? value : undefined;
    } finally {
        db.close();
    }
};

/**
 * Browser-context: sends an extension message and returns the error or response.
 *
 * @param arg Message type, handler name and optional data.
 *
 * @returns Message result.
 */
export const sendExtensionMessage = async (
    arg: unknown,
): Promise<{ error: string | null; response: unknown }> => {
    const { handlerName, type, data } = arg as {
        handlerName: string;
        type: string;
        data?: unknown;
    };

    return new Promise((resolve) => {
        chrome.runtime.sendMessage({ handlerName, type, data }, (response: unknown) => {
            const runtimeError = chrome.runtime.lastError;
            const rejection = response as {
                __mozWebExtensionPolyfillReject__?: boolean;
                message?: string;
            } | undefined;
            const rejectionMessage = rejection?.__mozWebExtensionPolyfillReject__
                ? rejection.message ?? 'Unknown extension error'
                : null;

            resolve({
                error: runtimeError?.message ?? rejectionMessage,
                response,
            });
        });
    });
};

/**
 * Clicks a button when it becomes enabled.
 *
 * @param page E2E page handle.
 * @param text Button text.
 * @param timeoutMs Maximum wait time in milliseconds.
 *
 * @throws Error if the button does not appear before the timeout.
 */
export const clickButtonWhenReady = async (
    page: E2EPageHandle,
    text: string,
    timeoutMs = SELECTOR_WAIT_TIMEOUT_MS,
): Promise<void> => {
    await waitForValue(
        () => page.evaluate(clickButtonByText, text),
        (clicked) => clicked,
        timeoutMs,
    );
};

/**
 * Waits for the add-custom-filter modal to reach one of the target states.
 *
 * @param page E2E page handle.
 * @param targetStates Target modal states.
 * @param timeoutMs Maximum wait time in milliseconds.
 *
 * @returns Reached modal state.
 *
 * @throws Error if no target state is reached before the timeout.
 */
export const waitForModalState = async (
    page: E2EPageHandle,
    targetStates: E2EAddCustomModalState[],
    timeoutMs = SELECTOR_WAIT_TIMEOUT_MS,
): Promise<E2EAddCustomModalState> => {
    return waitForValue(
        () => page.evaluate(readModalState),
        (state) => targetStates.includes(state),
        timeoutMs,
    );
};

/**
 * Opens the custom filter group and the add-custom-filter modal with a
 * prefilled URL.
 *
 * The options page reads the subscribe query parameter only on mount, so the
 * page is reloaded with the target hash.
 *
 * @param page E2E page handle.
 * @param filterUrl Custom filter subscription URL.
 * @param timeoutMs Maximum wait time in milliseconds.
 */
export const openCustomFilterModal = async (
    page: E2EPageHandle,
    filterUrl: string,
    timeoutMs = SELECTOR_WAIT_TIMEOUT_MS,
): Promise<void> => {
    const hash = `#/filters?group=0&subscribe=${encodeURIComponent(filterUrl)}`;

    await page.waitForSelector(OPTIONS_PAGE_READY_SELECTOR, timeoutMs);
    await page.evaluate(setLocationHash, hash);
    await page.reload(timeoutMs);
    await page.waitForSelector(ADD_CUSTOM_FILTER_INPUT_SELECTOR, timeoutMs);
    await waitForValue(
        () => page.evaluate(readInputValue, ADD_CUSTOM_FILTER_INPUT_SELECTOR),
        (value) => value === filterUrl,
        timeoutMs,
    );
};

/**
 * Waits until custom filter metadata for a URL appears in storage.
 *
 * @param page E2E page handle.
 * @param filterUrl Custom filter subscription URL.
 * @param timeoutMs Maximum wait time in milliseconds.
 *
 * @returns Stored custom filter metadata.
 */
export const waitForCustomFilterByUrl = async (
    page: E2EPageHandle,
    filterUrl: string,
    timeoutMs = SELECTOR_WAIT_TIMEOUT_MS,
): Promise<E2ECustomFilterMetadata> => {
    return waitForValue(
        () => page.evaluate(readCustomFilters, READ_CUSTOM_FILTERS_ARGS),
        (filters) => filters.some((filter) => filter.customUrl === filterUrl),
        timeoutMs,
    ).then((filters) => filters.find((filter) => filter.customUrl === filterUrl)!);
};

/**
 * Adds a custom filter through the options page UI.
 *
 * @param page E2E page handle positioned on the options page.
 * @param filterUrl Custom filter subscription URL.
 *
 * @returns Added filter metadata and approve-step details.
 *
 * @throws Error if the modal shows an error instead of the approve step.
 */
export const addCustomFilterViaUi = async (
    page: E2EPageHandle,
    filterUrl: string,
): Promise<E2EAddedCustomFilter> => {
    await openCustomFilterModal(page, filterUrl);
    await clickButtonWhenReady(page, 'Next');

    const state = await waitForModalState(page, ['approve', 'error']);

    if (state === 'error') {
        throw new Error(`Add custom filter failed for ${filterUrl}: ${await page.evaluate(readModalText)}`);
    }

    const modalText = await page.evaluate(readModalText);
    const rulesCountMatch = /Rules count:\s*(\d+)/.exec(modalText);
    const rulesCount = rulesCountMatch ? Number(rulesCountMatch[1]) : Number.NaN;

    await clickButtonWhenReady(page, 'Add');

    const filter = await waitForCustomFilterByUrl(page, filterUrl);
    await page.waitForSelector(`#filter-${filter.filterId}-title`, SELECTOR_WAIT_TIMEOUT_MS);

    return {
        filter,
        rulesCount,
    };
};

/**
 * Submits a custom filter URL through the options page UI and waits for the
 * error step.
 *
 * @param page E2E page handle positioned on the options page.
 * @param filterUrl Custom filter subscription URL.
 *
 * @returns Error-step text.
 */
export const addCustomFilterViaUiExpectingError = async (
    page: E2EPageHandle,
    filterUrl: string,
): Promise<string> => {
    await openCustomFilterModal(page, filterUrl);
    await clickButtonWhenReady(page, 'Next');
    await waitForModalState(page, ['error']);

    return page.evaluate(readModalText);
};

/**
 * Reads the preprocessed filter content from extension storage.
 *
 * @param page E2E page handle.
 * @param filterId Filter identifier.
 *
 * @returns Filter content or undefined.
 */
export const readFilterContent = async (
    page: E2EPageHandle,
    filterId: number,
): Promise<string | undefined> => {
    return page.evaluate(readIndexedDbValue, {
        dbName: IDB_STORAGE_NAME,
        version: IDB_STORAGE_VERSION,
        storeName: IDB_STORE_NAME,
        key: `${FILTER_CONTENT_STORAGE_KEY}${FILTER_STORAGE_KEY_COMBINER}${filterId}`,
    });
};
