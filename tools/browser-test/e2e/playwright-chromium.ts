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

import path from 'node:path';

import {
    chromium,
    type BrowserContext,
    type ConsoleMessage,
    type Page,
    type WebError,
    type Worker,
} from 'playwright';

import { MessageType } from '../../../Extension/src/common/messages/constants';
import { setTsWebExtensionConfig } from '../page-injections';
import { DEFAULT_EXTENSION_CONFIG } from '../test-constants';

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

const CHROMIUM_MV2_DISABLED_FEATURES = [
    'ExtensionManifestV2Unsupported',
    'ExtensionManifestV2Disabled',
    'ExtensionManifestV2DeprecationWarning',
].join(',');

const CHROMIUM_MV2_FLAGS = [
    `--disable-features=${CHROMIUM_MV2_DISABLED_FEATURES}`,
    '--enable-features=ExtensionManifestV2Availability',
];

const CHROMIUM_WINDOW_ARGS = [
    '--window-position=-32000,-32000',
    '--window-size=1280,900',
];

const CHROMIUM_HEADLESS_ARG = '--headless=new';

const CHROMIUM_CONFIG_HOOK_TIMEOUT_MS = 30_000;

const CHROMIUM_CONFIG_HOOK_POLL_INTERVAL_MS = 100;

const CHROMIUM_ENGINE_STARTED_LOG = '[ext.Engine.start]: tswebextension is started.';

const CHROMIUM_ENGINE_START_TIMEOUT_MS = 30_000;

type ChromiumE2ESession = {
    context: BrowserContext;
    extensionId: string;
    backgroundTarget: Page | Worker;
    backgroundErrors: E2EErrorCollector;
};

/**
 * Creates Chromium launch arguments for an E2E test extension.
 *
 * @param extensionPath Unpacked extension path.
 * @param manifestVersion Manifest version number or MV3 boolean.
 *
 * @returns Chromium launch arguments.
 */
export const createChromiumLaunchArgs = (extensionPath: string, manifestVersion: number | boolean): string[] => {
    const args = [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
        ...CHROMIUM_WINDOW_ARGS,
    ];

    if (manifestVersion === 2 || manifestVersion === false) {
        args.push(...CHROMIUM_MV2_FLAGS);
    }

    return args;
};

/**
 * Extracts an extension id from a chrome-extension URL.
 *
 * @param url Chrome extension URL.
 *
 * @returns Extension id.
 */
export const getExtensionIdFromUrl = (url: string): string => new URL(url).hostname;

/**
 * Checks whether a Chromium background console message means the engine is ready.
 *
 * @param message Console message text.
 *
 * @returns True if the message indicates started tswebextension engine.
 */
export const isChromiumEngineStartedLog = (message: string): boolean => {
    return message.includes(CHROMIUM_ENGINE_STARTED_LOG);
};

/**
 * Starts a Playwright Chromium E2E session.
 *
 * @param entry E2E matrix entry.
 * @param extensionPath Unpacked extension path.
 *
 * @returns Chromium E2E session.
 */
export const launchChromiumE2ESession = async (
    entry: E2EMatrixEntry,
    extensionPath: string,
): Promise<ChromiumE2ESession> => {
    const userDataDir = path.join('tmp', 'e2e', entry.id, 'chromium-profile');
    const args = [
        ...createChromiumLaunchArgs(extensionPath, entry.isMv3 ? 3 : 2),
        ...(process.env.E2E_HEADLESS === 'false' ? [] : [CHROMIUM_HEADLESS_ARG]),
    ];
    const executablePath = process.env.E2E_CHROMIUM_EXECUTABLE_PATH;

    const context = await chromium.launchPersistentContext(userDataDir, {
        headless: false,
        args,
        executablePath,
    });

    let backgroundTarget: Page | Worker;
    let extensionId: string;

    if (entry.isMv3) {
        backgroundTarget = await getMv3BackgroundTarget(context);
        extensionId = getExtensionIdFromUrl(backgroundTarget.url());
        await configureChromiumTsWebExtension(backgroundTarget);
    } else {
        backgroundTarget = await getMv2BackgroundTarget(context);
        extensionId = getExtensionIdFromUrl(backgroundTarget.url());
        await waitForChromiumEngineStartedFromContext(context);
    }

    // Engine-start log is emitted before AppCommon marks app initialized.
    await waitForChromiumAppInitialized(context, extensionId);

    const backgroundErrors = new E2EErrorCollector();
    bindChromiumBackgroundErrorListeners(context, backgroundErrors, entry.id);

    if (!entry.isMv3) {
        bindChromiumPageErrorListeners(
            backgroundTarget as Page,
            backgroundErrors,
            entry.id,
            E2ESpecialSurfaceId.Background,
            'chromium-background-page',
        );
    }

    return {
        context,
        extensionId,
        backgroundTarget,
        backgroundErrors,
    };
};

/**
 * Closes a Chromium E2E session.
 *
 * @param session Chromium E2E session.
 *
 * @returns Nothing.
 */
export const closeChromiumE2ESession = async (session: ChromiumE2ESession): Promise<void> => {
    await session.context.close();
};

/**
 * Opens a Chromium E2E surface page and returns a handle for test assertions.
 * The caller is responsible for closing the page via `handle.close()`.
 *
 * @param session Chromium E2E session.
 * @param entry E2E matrix entry.
 * @param surface E2E surface definition.
 *
 * @returns Page handle for assertions.
 */
export const openChromiumE2ESurface = async (
    session: ChromiumE2ESession,
    entry: E2EMatrixEntry,
    surface: E2ESurface,
): Promise<E2EPageHandle> => {
    const page = await session.context.newPage();
    const errors = new E2EErrorCollector();
    const backgroundCursor = session.backgroundErrors.getCursor();

    bindChromiumPageErrorListeners(page, errors, entry.id, surface.id, 'chromium-page');

    const url = await createChromiumSurfaceUrl(session, surface);
    await page.goto(url, { waitUntil: surface.waitUntil });

    return {
        async querySelectorCount(selector: string): Promise<number> {
            return page.locator(selector).count();
        },
        async waitForSelector(selector: string, timeoutMs = 5000): Promise<void> {
            await page.locator(selector).first().waitFor({ timeout: timeoutMs });
        },
        async getErrors(): Promise<E2EError[]> {
            return errors.getErrors();
        },
        async getBackgroundErrors(): Promise<E2EError[]> {
            return session.backgroundErrors.sliceFrom(backgroundCursor);
        },
        async close(): Promise<void> {
            await page.close();
        },
    };
};

/**
 * Adds Chromium context-level background error listeners.
 *
 * @param context Browser context.
 * @param errors Error collector.
 * @param matrixId E2E matrix entry id.
 */
const bindChromiumBackgroundErrorListeners = (
    context: BrowserContext,
    errors: E2EErrorCollector,
    matrixId: string,
): void => {
    context.on('console', (message: ConsoleMessage): void => {
        const page = message.page();

        if (page || !isErrorConsoleType(message.type())) {
            return;
        }

        errors.add(createConsoleErrorRecord({
            matrixId,
            surfaceId: E2ESpecialSurfaceId.Background,
            source: 'chromium-background-console',
            message: message.text(),
            url: message.location().url,
        }));
    });

    context.on('weberror', (webError: WebError): void => {
        const page = webError.page();

        if (page) {
            return;
        }

        errors.add(createUnknownError(
            matrixId,
            E2ESpecialSurfaceId.Background,
            'chromium-background-pageerror',
            '',
            webError.error(),
        ));
    });
};

/**
 * Adds Chromium page-level error listeners.
 *
 * @param page Playwright page.
 * @param errors Error collector.
 * @param matrixId E2E matrix entry id.
 * @param surfaceId E2E surface id.
 * @param sourcePrefix Error source prefix.
 */
const bindChromiumPageErrorListeners = (
    page: Page,
    errors: E2EErrorCollector,
    matrixId: string,
    surfaceId: E2EResultSurfaceId,
    sourcePrefix: string,
): void => {
    page.on('console', (message: ConsoleMessage): void => {
        if (!isErrorConsoleType(message.type())) {
            return;
        }

        errors.add(createConsoleErrorRecord({
            matrixId,
            surfaceId,
            source: `${sourcePrefix}-console`,
            message: message.text(),
            url: message.location().url,
        }));
    });

    page.on('pageerror', (error: Error): void => {
        errors.add(createUnknownError(matrixId, surfaceId, `${sourcePrefix}-pageerror`, page.url(), error));
    });
};

/**
 * Gets an MV3 extension background target.
 *
 * @param context Browser context.
 *
 * @returns MV3 service worker.
 */
const getMv3BackgroundTarget = async (context: BrowserContext): Promise<Worker> => (
    context.serviceWorkers()[0] ?? await context.waitForEvent('serviceworker')
);

/**
 * Gets the actual MV2 background page.
 *
 * @param context Browser context.
 *
 * @returns MV2 background page.
 */
const getMv2BackgroundTarget = async (context: BrowserContext): Promise<Page> => (
    context.backgroundPages()[0] ?? await context.waitForEvent('backgroundpage')
);

/**
 * Waits until Chromium background logs that tswebextension has started.
 *
 * @param context Browser context.
 *
 * @returns Nothing.
 *
 * @throws Error if engine start log is not emitted before timeout.
 */
const waitForChromiumEngineStartedFromContext = (context: BrowserContext): Promise<void> => {
    return new Promise((resolve, reject) => {
        let timeoutId: ReturnType<typeof setTimeout>;

        /**
         * Resolves engine start wait when background emits ready log.
         *
         * @param message Console message.
         */
        const handleConsoleMessage = (message: ConsoleMessage): void => {
            if (!isChromiumEngineStartedLog(message.text())) {
                return;
            }

            clearTimeout(timeoutId);
            context.off('console', handleConsoleMessage);
            resolve();
        };

        /**
         * Rejects engine start wait on timeout.
         */
        const handleTimeout = (): void => {
            context.off('console', handleConsoleMessage);
            reject(new Error(`Timed out waiting for Chromium engine start log: ${CHROMIUM_ENGINE_STARTED_LOG}`));
        };

        timeoutId = setTimeout(handleTimeout, CHROMIUM_ENGINE_START_TIMEOUT_MS);

        context.on('console', handleConsoleMessage);
    });
};

/**
 * Applies the default browser-test TSWebExtension configuration.
 *
 * @param target Extension background target.
 *
 * @returns Nothing.
 */
const configureChromiumTsWebExtension = async (target: Page | Worker): Promise<void> => {
    await waitForChromiumTsWebExtensionConfigHook(target);

    await target.evaluate<void, typeof DEFAULT_EXTENSION_CONFIG>(
        setTsWebExtensionConfig,
        DEFAULT_EXTENSION_CONFIG,
    );
};

/**
 * Waits until the MV3 background exposes the browser-test configuration hook.
 *
 * @param target Extension background target.
 *
 * @returns Nothing.
 *
 * @throws Error if the hook is not exposed before timeout.
 */
const waitForChromiumTsWebExtensionConfigHook = async (target: Page | Worker): Promise<void> => {
    const startedAt = Date.now();

    while (Date.now() - startedAt < CHROMIUM_CONFIG_HOOK_TIMEOUT_MS) {
        const isAvailable = await hasChromiumTsWebExtensionConfigHook(target);

        if (isAvailable) {
            return;
        }

        await new Promise<void>((resolve) => {
            setTimeout(resolve, CHROMIUM_CONFIG_HOOK_POLL_INTERVAL_MS);
        });
    }

    throw new Error('Timed out waiting for self.adguard.configure.');
};

/**
 * Checks whether the MV3 background exposes the browser-test configuration hook.
 *
 * @param target Extension background target.
 *
 * @returns True if the hook is available.
 */
const hasChromiumTsWebExtensionConfigHook = async (target: Page | Worker): Promise<boolean> => {
    return target.evaluate((): boolean => {
        const globalObject = globalThis as typeof globalThis & {
            adguard?: {
                configure?: unknown;
            };
        };

        return typeof globalObject.adguard?.configure === 'function';
    });
};

/**
 * Waits until Chromium extension app reports completed initialization.
 *
 * @param context Browser context.
 * @param extensionId Chromium extension id.
 *
 * @returns Nothing.
 */
const waitForChromiumAppInitialized = async (context: BrowserContext, extensionId: string): Promise<void> => {
    const page = await context.newPage();

    try {
        await page.goto(
            createExtensionPageUrl(E2EExtensionScheme.ChromeExtension, extensionId, '/pages/popup.html'),
            { waitUntil: 'load' },
        );
        await page.waitForFunction((messageType) => new Promise((resolve) => {
            chrome.runtime.sendMessage({ type: messageType }, (response) => {
                resolve(response === true);
            });
        }), MessageType.GetIsAppInitialized, { timeout: 30_000 });
    } finally {
        await page.close();
    }
};

/**
 * Creates a Chromium extension surface URL.
 *
 * @param session Chromium E2E session.
 * @param surface E2E surface definition.
 *
 * @returns Extension surface URL.
 */
const createChromiumSurfaceUrl = async (
    session: ChromiumE2ESession,
    surface: E2ESurface,
): Promise<string> => {
    if (surface.id !== E2ESurfaceId.FilteringLog) {
        return createExtensionPageUrl(E2EExtensionScheme.ChromeExtension, session.extensionId, surface.path);
    }

    const tabId = await createChromiumE2ETab(session.backgroundTarget);

    return createExtensionPageUrl(E2EExtensionScheme.ChromeExtension, session.extensionId, `${surface.path}#${tabId}`);
};

/**
 * Creates a regular active browser tab for filtering-log E2E checks.
 *
 * @param target Extension background target.
 *
 * @returns Created tab id.
 */
const createChromiumE2ETab = async (target: Page | Worker): Promise<number> => {
    return target.evaluate((): Promise<number> => new Promise((resolve, reject) => {
        chrome.tabs.create({ url: 'about:blank' }, (tab): void => {
            const runtimeError = chrome.runtime.lastError;

            if (runtimeError) {
                reject(new Error(runtimeError.message));
                return;
            }

            if (typeof tab.id !== 'number') {
                reject(new Error('Created E2E tab has no tab id.'));
                return;
            }

            resolve(tab.id);
        });
    }));
};
