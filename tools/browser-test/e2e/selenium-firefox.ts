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
import path from 'node:path';

import {
    Builder,
    LogInspector,
    type WebDriver,
} from 'selenium-webdriver';
import type { ConsoleLogEntry, JavascriptLogEntry } from 'selenium-webdriver/bidi/logEntries';
import firefox from 'selenium-webdriver/firefox';

import { APP_MESSAGE_HANDLER_NAME, MessageType } from '../../../Extension/src/common/messages/constants';

import {
    E2EErrorCollector,
    createConsoleErrorRecord,
    createUnknownError,
    isErrorConsoleType,
} from './error-collector';
import { type E2EPageHandle } from './page-handle';
import { createExtensionPageUrl } from './surfaces';
import {
    E2EExtensionScheme,
    type E2EError,
    type E2EMatrixEntry,
    type E2EResultSurfaceId,
    E2ESpecialSurfaceId,
    type E2ESurface,
    E2ESurfaceId,
} from './types';

export const FIREFOX_EXTENSION_HOST = 'adguard-e2e';

const FIREFOX_PAGE_LOAD_TIMEOUT_MS = 20_000;

const FIREFOX_BIDI_SETUP_TIMEOUT_MS = 10_000;

const FIREFOX_APP_INIT_TIMEOUT_MS = 30_000;

/**
 * Mutable reference to the current foreground BiDi browsing-context id.
 *
 * Used by the BiDi error listener to distinguish background-page errors
 * from foreground-page console entries.
 *
 * Note: this must be a BiDi browsing-context id (resolved from the BiDi
 * browsing-context tree), NOT a Selenium window handle returned by
 * `driver.getWindowHandle()`. In Firefox these are different id spaces, so
 * comparing a window handle against `entry.source.browsingContextId` never
 * matches and foreground errors leak into the background error collector.
 */
type BrowsingContextRef = {
    /**
     * Current BiDi browsing-context id, or null if not yet captured.
     */
    current: string | null;
};

/**
 * Raw BiDi `browsingContext.getTree` response context entry.
 */
type BidiContextInfo = {
    /**
     * BiDi browsing-context id.
     */
    context: string;

    /**
     * Document URL loaded in the browsing context.
     */
    url: string;

    /**
     * Child browsing contexts.
     */
    children?: BidiContextInfo[];

    /**
     * Parent browsing context id, if any.
     */
    parent?: string | null;
};

/**
 * Resolves the BiDi browsing-context id for the page currently loaded in the
 * foreground tab by matching its URL against the BiDi browsing-context tree.
 *
 * Selenium's `getWindowHandle()` returns a WebDriver window handle which is NOT
 * the same value as a BiDi browsing-context id in Firefox. Comparing the two
 * never matches, so foreground console errors were incorrectly collected as
 * background errors. This helper queries the BiDi tree and returns the real
 * context id for the given URL.
 *
 * @param driver Selenium WebDriver instance.
 * @param expectedUrl URL (prefix) of the foreground page to resolve.
 *
 * @returns BiDi browsing-context id, or null if not found.
 */
const getFirefoxBidiContextId = async (
    driver: WebDriver,
    expectedUrl: string,
): Promise<string | null> => {
    try {
        const bidi = await driver.getBidi();
        const result = await bidi.send({
            method: 'browsingContext.getTree',
            params: {},
        }) as { result?: { contexts?: BidiContextInfo[] } };

        const contexts = result?.result?.contexts;
        if (!Array.isArray(contexts)) {
            return null;
        }

        // Search recursively through the browsing-context tree.
        // Firefox may nest tab contexts under a top-level window context,
        // so a flat top-level search is not sufficient.

        /**
         * Recursively searches the BiDi browsing-context tree for a context
         * whose URL starts with the expected prefix.
         *
         * @param nodes Current level of browsing contexts to search.
         *
         * @returns Matching BiDi browsing-context id, or null if not found.
         */
        const findContext = (nodes: BidiContextInfo[]): string | null => {
            for (const ctx of nodes) {
                if (typeof ctx?.url === 'string' && ctx.url.startsWith(expectedUrl)) {
                    return ctx.context;
                }
                if (Array.isArray(ctx?.children)) {
                    const found = findContext(ctx.children);
                    if (found !== null) {
                        return found;
                    }
                }
            }
            return null;
        };

        return findContext(contexts);
    } catch {
        return null;
    }
};

/**
 * Firefox E2E session state, holding the WebDriver instance, the background
 * error collector, and the foreground browsing context reference.
 */
type FirefoxE2ESession = {
    /**
     * Selenium Firefox WebDriver instance.
     */
    driver: firefox.Driver;

    /**
     * Collector for background-page errors (console errors, JS exceptions).
     */
    backgroundErrors: E2EErrorCollector;

    /**
     * Mutable reference to the current foreground browsing context.
     */
    foregroundContext: BrowsingContextRef;
};

type FirefoxManifest = {
    browser_specific_settings?: {
        gecko?: {
            id?: string;
        };
    };
    applications?: {
        gecko?: {
            id?: string;
        };
    };
};

/**
 * Creates Firefox WebExtension UUID preference JSON.
 *
 * @param extensionId Firefox extension id.
 *
 * @returns Firefox WebExtension UUID preference JSON.
 */
export const createFirefoxUuidPreference = (extensionId: string): string => {
    return JSON.stringify({
        [extensionId]: FIREFOX_EXTENSION_HOST,
    });
};

/**
 * Creates Firefox preferences for deterministic E2E extension URLs.
 *
 * @param extensionId Firefox extension id.
 *
 * @returns Firefox preference map.
 */
export const createFirefoxPrefs = (extensionId: string): Record<string, string> => {
    return ({
        'extensions.webextensions.uuids': createFirefoxUuidPreference(extensionId),
    });
};

/**
 * Creates a Firefox extension page URL.
 *
 * @param pagePath Extension page path.
 *
 * @returns Firefox extension page URL.
 */
export const createFirefoxExtensionUrl = (pagePath: string): string => {
    return (
        createExtensionPageUrl(E2EExtensionScheme.MozExtension, FIREFOX_EXTENSION_HOST, pagePath)
    );
};

/**
 * Creates a regular browser tab for filtering-log E2E checks.
 * Executes on an already-loaded extension page where `browser.tabs` API is available,
 * then sets `document.location.hash` so the filtering-log component picks up the tab id.
 *
 * @param driver Selenium WebDriver instance.
 *
 * @returns Nothing.
 */
const createFirefoxE2ETab = async (driver: firefox.Driver): Promise<void> => {
    await driver.executeAsyncScript(
        'var cb = arguments[arguments.length - 1];'
        + 'browser.tabs.create({ url: "about:blank" })'
        + '.then(function(tab) { document.location.hash = String(tab.id); cb(); })'
        + '.catch(function() { cb(); });',
    );
};

/**
 * Waits until the Firefox extension background has fully initialized.
 * Opens the popup page, sends a `GetIsAppInitialized` message, and waits
 * until the background replies with `true`.
 *
 * @param driver Selenium WebDriver instance.
 *
 * @returns Nothing.
 */
const waitForFirefoxAppInitialized = async (driver: firefox.Driver): Promise<void> => {
    const popupUrl = createFirefoxExtensionUrl('/pages/popup.html');
    await driver.get(popupUrl);

    await driver.wait(async () => {
        const result = await driver.executeAsyncScript(
            'var cb = arguments[arguments.length - 1];'
            + 'browser.runtime.sendMessage('
            + `{ handlerName: "${APP_MESSAGE_HANDLER_NAME}", type: "${MessageType.GetIsAppInitialized}" })`
            + '.then(function(r) { cb(r === true); })'
            + '.catch(function() { cb(false); });',
        );
        return result === true;
    }, FIREFOX_APP_INIT_TIMEOUT_MS, 'Firefox extension app initialization timed out');
};

/**
 * Starts a Selenium Firefox E2E session.
 *
 * @param entry E2E matrix entry.
 * @param extensionPath Unpacked extension path.
 *
 * @returns Firefox E2E session.
 */
export const launchFirefoxE2ESession = async (
    entry: E2EMatrixEntry,
    extensionPath: string,
): Promise<FirefoxE2ESession> => {
    const options = new firefox.Options();
    const extensionId = getFirefoxExtensionId(extensionPath);
    const prefs = createFirefoxPrefs(extensionId);

    Object.entries(prefs).forEach(([key, value]): void => {
        options.setPreference(key, value);
    });

    if (process.env.E2E_HEADLESS !== 'false') {
        options.addArguments('-headless');
    }

    options.enableBidi();

    const driver = await new Builder()
        .forBrowser('firefox')
        .setFirefoxOptions(options)
        .build() as firefox.Driver;

    await driver.manage().setTimeouts({
        implicit: 0,
        pageLoad: FIREFOX_PAGE_LOAD_TIMEOUT_MS,
        script: 10_000,
    });

    await driver.installAddon(extensionPath, true);
    await waitForFirefoxAppInitialized(driver);

    const backgroundErrors = new E2EErrorCollector();
    const foregroundContext: BrowsingContextRef = { current: null };

    await bindFirefoxBackgroundErrorListeners(driver, backgroundErrors, entry.id, foregroundContext);

    // Capture the initial foreground BiDi browsing context (the popup page opened during app init).
    // Selenium's window handle is NOT a BiDi browsing-context id in Firefox, so
    // resolve the real context id from the BiDi tree by matching the popup URL.
    foregroundContext.current = await getFirefoxBidiContextId(
        driver,
        createFirefoxExtensionUrl('/pages/popup.html'),
    );

    return {
        driver,
        backgroundErrors,
        foregroundContext,
    };
};

/**
 * Reads Firefox extension id from an unpacked manifest.
 *
 * @param extensionPath Unpacked extension path.
 *
 * @returns Firefox extension id.
 *
 * @throws Error if manifest has no Firefox extension id.
 */
const getFirefoxExtensionId = (extensionPath: string): string => {
    const manifestPath = path.join(extensionPath, 'manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as FirefoxManifest;
    const extensionId = manifest.browser_specific_settings?.gecko?.id
        ?? manifest.applications?.gecko?.id;

    if (!extensionId) {
        throw new Error(`Firefox extension id not found in ${manifestPath}.`);
    }

    return extensionId;
};

/**
 * Closes a Selenium Firefox E2E session.
 *
 * @param session Firefox E2E session.
 *
 * @returns Nothing.
 */
export const closeFirefoxE2ESession = async (session: FirefoxE2ESession): Promise<void> => {
    await session.driver.quit();
};

/**
 * Opens a Firefox E2E surface page and returns a handle for test assertions.
 * Firefox reuses the single driver window, so `close()` is a no-op.
 *
 * @param session Firefox E2E session.
 * @param entry E2E matrix entry.
 * @param surface E2E surface definition.
 *
 * @returns Page handle for assertions.
 */
export const openFirefoxE2ESurface = async (
    session: FirefoxE2ESession,
    entry: E2EMatrixEntry,
    surface: E2ESurface,
): Promise<E2EPageHandle> => {
    const backgroundCursor = session.backgroundErrors.getCursor();

    const surfaceUrl = createFirefoxExtensionUrl(surface.path);

    await withTimeout(
        session.driver.get(surfaceUrl),
        FIREFOX_PAGE_LOAD_TIMEOUT_MS,
        `Firefox page load timed out: ${surface.id}`,
    );
    await waitForFirefoxPageReadyState(session.driver, surface.waitUntil, surface.id);

    // Update the foreground BiDi browsing context so the error listener can
    // distinguish between background errors and foreground page errors.
    // Selenium's window handle is NOT a BiDi browsing-context id in Firefox,
    // so resolve the real context id from the BiDi tree by matching the URL.
    // Resolved before `createFirefoxE2ETab` mutates the filtering-log URL hash.
    session.foregroundContext.current = await getFirefoxBidiContextId(session.driver, surfaceUrl);

    if (surface.id === E2ESurfaceId.FilteringLog) {
        await createFirefoxE2ETab(session.driver);
    }

    await injectPageErrorCollector(session.driver);

    return {
        async querySelectorCount(selector: string): Promise<number> {
            const elements = await session.driver.findElements({ css: selector });
            return elements.length;
        },
        async waitForSelector(selector: string, timeoutMs = 5000): Promise<void> {
            await session.driver.wait(
                async () => {
                    const els = await session.driver.findElements({ css: selector });
                    return els.length > 0;
                },
                timeoutMs,
                `Timed out waiting for selector: ${selector}`,
            );
        },
        async getErrors(): Promise<E2EError[]> {
            return collectPageErrors(session.driver, entry.id, surface.id);
        },
        async getBackgroundErrors(): Promise<E2EError[]> {
            return session.backgroundErrors.sliceFrom(backgroundCursor);
        },
        async close(): Promise<void> {
            // Firefox uses a single driver window; no separate page to close.
        },
    };
};

/**
 * Injects a page-level error collector into the current page.
 * Captures uncaught exceptions and console.error calls in a global array.
 *
 * @param driver Selenium WebDriver instance.
 *
 * @returns Nothing.
 */
const injectPageErrorCollector = async (driver: firefox.Driver): Promise<void> => {
    await driver.executeScript(`
        if (!window.__e2ePageErrorsInstalled) {
            window.__e2ePageErrorsInstalled = true;
            window.__e2ePageErrors = [];
            var origError = console.error;
            window.addEventListener('error', function(e) {
                window.__e2ePageErrors.push({ message: e.message || String(e), url: e.filename || '' });
            });
            window.addEventListener('unhandledrejection', function(e) {
                var msg = e.reason instanceof Error ? e.reason.message : String(e.reason);
                window.__e2ePageErrors.push({ message: msg, url: '' });
            });
            console.error = function() {
                var msg = Array.prototype.map.call(arguments, String).join(' ');
                window.__e2ePageErrors.push({ message: msg, url: '' });
                origError.apply(console, arguments);
            };
        } else {
            window.__e2ePageErrors = [];
        }
    `);
};

/**
 * Reads page-level errors collected by the injected script.
 *
 * @param driver Selenium WebDriver instance.
 * @param matrixId E2E matrix id.
 * @param surfaceId E2E surface id.
 *
 * @returns Collected page-level E2E errors.
 */
const collectPageErrors = async (
    driver: firefox.Driver,
    matrixId: string,
    surfaceId: E2EResultSurfaceId,
): Promise<E2EError[]> => {
    const raw = await driver.executeScript('return window.__e2ePageErrors || [];') as unknown;
    const errors = raw as Array<{ message: string; url: string }>;

    return errors.map((err): E2EError => ({
        matrixId,
        surfaceId,
        source: 'firefox-page',
        message: err.message,
        url: err.url,
        timestamp: new Date().toISOString(),
    }));
};

/**
 * Waits until Firefox page reaches requested document readiness state.
 *
 * @param driver Selenium WebDriver instance.
 * @param waitUntil Shared surface readiness state.
 * @param surfaceId E2E surface id.
 *
 * @returns Nothing.
 */
const waitForFirefoxPageReadyState = async (
    driver: firefox.Driver,
    waitUntil: E2ESurface['waitUntil'],
    surfaceId: E2ESurfaceId,
): Promise<void> => {
    const expectedStates = waitUntil === 'domcontentloaded'
        ? ['interactive', 'complete']
        : ['complete'];

    await driver.wait(
        async () => {
            const readyState = await driver.executeScript('return document.readyState;') as string;
            return expectedStates.includes(readyState);
        },
        FIREFOX_PAGE_LOAD_TIMEOUT_MS,
        `Firefox page readiness timed out: ${surfaceId}`,
    );
};

/**
 * Adds Firefox BiDi log listeners where supported.
 *
 * The `foregroundContext` ref is used to filter out console entries from
 * foreground extension pages, so only true background-page errors are collected.
 *
 * @param driver Selenium WebDriver instance.
 * @param errors Error collector.
 * @param matrixId E2E matrix entry id.
 * @param foregroundContext Mutable reference to the current foreground browsing context.
 *
 * @returns Nothing.
 */
const bindFirefoxBackgroundErrorListeners = async (
    driver: WebDriver,
    errors: E2EErrorCollector,
    matrixId: string,
    foregroundContext: BrowsingContextRef,
): Promise<void> => {
    try {
        const logInspector = await withTimeout(
            LogInspector(driver),
            FIREFOX_BIDI_SETUP_TIMEOUT_MS,
            'Firefox BiDi log listener setup timed out.',
        );

        await withTimeout(
            logInspector.onConsoleEntry((entry: ConsoleLogEntry): void => {
                if (!isErrorConsoleType(entry.method)) {
                    return;
                }

                // Skip console entries from the foreground browsing context
                // (extension pages like popup, options, filtering-log).
                // The background page has a separate browsing context, so only
                // entries without a matching foreground context are background errors.
                if (foregroundContext.current
                    && entry.source.browsingContextId === foregroundContext.current) {
                    return;
                }

                errors.add(createFirefoxLogError(matrixId, E2ESpecialSurfaceId.Background, 'firefox-console', entry));
            }),
            FIREFOX_BIDI_SETUP_TIMEOUT_MS,
            'Firefox console listener setup timed out.',
        );

        await withTimeout(
            logInspector.onJavascriptException((entry: JavascriptLogEntry): void => {
                // Skip JS exceptions from the foreground browsing context
                // (extension pages like popup, options, filtering-log).
                // The background page has a separate browsing context, so only
                // entries without a matching foreground context are background errors.
                if (foregroundContext.current
                    && entry.source.browsingContextId === foregroundContext.current) {
                    return;
                }

                errors.add(createFirefoxLogError(
                    matrixId,
                    E2ESpecialSurfaceId.Background,
                    'firefox-exception',
                    entry,
                ));
            }),
            FIREFOX_BIDI_SETUP_TIMEOUT_MS,
            'Firefox exception listener setup timed out.',
        );
    } catch (error: unknown) {
        errors.add(createUnknownError(matrixId, E2ESpecialSurfaceId.Background, 'firefox-bidi-setup', '', error));
    }
};

/**
 * Creates a Firefox E2E error from a BiDi log entry.
 *
 * @param matrixId E2E matrix id.
 * @param surfaceId E2E surface id.
 * @param source Error source.
 * @param entry BiDi log entry.
 *
 * @returns E2E error.
 */
const createFirefoxLogError = (
    matrixId: string,
    surfaceId: E2EResultSurfaceId,
    source: string,
    entry: ConsoleLogEntry | JavascriptLogEntry,
): E2EError => createConsoleErrorRecord({
    matrixId,
    surfaceId,
    source,
    message: entry.text,
    url: `firefox-bidi:${entry.source.realmId}`,
});

/**
 * Rejects a promise if it does not settle before timeout.
 *
 * @param promise Promise to guard.
 * @param timeoutMs Timeout in milliseconds.
 * @param message Timeout error message.
 *
 * @returns Original promise result.
 */
const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> => {
    let timeoutId!: ReturnType<typeof setTimeout>;

    const timeoutPromise = new Promise<never>((resolve, reject): void => {
        timeoutId = setTimeout((): void => {
            reject(new Error(message));
        }, timeoutMs);
    });

    try {
        return await Promise.race([promise, timeoutPromise]);
    } finally {
        clearTimeout(timeoutId);
    }
};
