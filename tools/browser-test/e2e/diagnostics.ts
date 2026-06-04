/**
 * Copyright (c) 2015-2026 Adguard Software Ltd.
 *
 * @file CI-friendly structured diagnostics for E2E tests (grep for [e2e-debug] in Bamboo logs).
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

import fs from 'node:fs';
import path from 'node:path';

import type { WebDriver } from 'selenium-webdriver';

import {
    CONTENT_SCRIPT_END_OUTPUT,
    CONTENT_SCRIPT_START_OUTPUT,
    SUBSCRIBE_OUTPUT,
    THANKYOU_OUTPUT,
} from '../../../constants';

import { type E2EError } from './types';

/** Log prefix for grep in CI (e.g. Bamboo build logs). */
export const E2E_DEBUG_LOG_PREFIX = '[e2e-debug]';

/**
 * Content scripts referenced in manifest and ContentScriptInjector; failures often mention these paths.
 */
export const E2E_WATCHED_CONTENT_SCRIPT_FILES = [
    `${CONTENT_SCRIPT_START_OUTPUT}.js`,
    `${CONTENT_SCRIPT_END_OUTPUT}.js`,
    `${SUBSCRIBE_OUTPUT}.js`,
    `${THANKYOU_OUTPUT}.js`,
] as const;

/**
 * Returns whether structured E2E diagnostics are enabled.
 * Enabled by default; set E2E_DEBUG=false to disable.
 *
 * @returns True when diagnostics should be emitted.
 */
export const isE2EDiagnosticsEnabled = (): boolean => process.env.E2E_DEBUG !== 'false';

type E2EDiagnosticPayload = {
    hypothesisId: string;
    location: string;
    message: string;
    data: Record<string, unknown>;
    timestamp: string;
};

/**
 * Emits one JSON line to stdout for CI log parsers.
 *
 * @param hypothesisId Hypothesis identifier (A–E).
 * @param location Source location label.
 * @param message Short description.
 * @param data Structured context.
 */
export const logE2EDiagnostic = (
    hypothesisId: string,
    location: string,
    message: string,
    data: Record<string, unknown>,
): void => {
    if (!isE2EDiagnosticsEnabled()) {
        return;
    }

    const payload: E2EDiagnosticPayload = {
        hypothesisId,
        location,
        message,
        data,
        timestamp: new Date().toISOString(),
    };

    // eslint-disable-next-line no-console
    console.log(`${E2E_DEBUG_LOG_PREFIX} ${JSON.stringify(payload)}`);
};

type FileStat = {
    exists: boolean;
    sizeBytes: number | null;
};

/**
 * Returns file size or null when the path is missing.
 *
 * @param filePath Absolute or relative file path.
 *
 * @returns File stat summary.
 */
const statFile = (filePath: string): FileStat => {
    try {
        const stat = fs.statSync(filePath);
        return { exists: true, sizeBytes: stat.size };
    } catch {
        return { exists: false, sizeBytes: null };
    }
};

type ManifestContentScripts = {
    content_scripts?: {
        js?: string[];
    }[];
};

/**
 * Reads manifest content_scripts JS paths.
 *
 * @param extensionPath Unpacked extension root.
 *
 * @returns Manifest-declared script paths.
 */
const readManifestContentScriptPaths = (extensionPath: string): string[] => {
    const manifestPath = path.join(extensionPath, 'manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as ManifestContentScripts;
    const paths: string[] = [];

    manifest.content_scripts?.forEach((entry) => {
        entry.js?.forEach((scriptPath) => paths.push(scriptPath));
    });

    return paths;
};

/**
 * Logs zip/unpacked artifact integrity (hypothesis A: missing files after unpack).
 *
 * @param matrixId E2E matrix id.
 * @param extensionPath Unpacked extension directory.
 * @param zipPath Optional zip artifact path.
 */
export const logExtensionArtifactDiagnostics = (
    matrixId: string,
    extensionPath: string,
    zipPath?: string,
): void => {
    const watchedFiles = Object.fromEntries(
        E2E_WATCHED_CONTENT_SCRIPT_FILES.map((relativePath) => [
            relativePath,
            statFile(path.join(extensionPath, relativePath)),
        ]),
    );

    let pagesJsCount: number | null = null;
    const pagesDir = path.join(extensionPath, 'pages');

    try {
        pagesJsCount = fs.readdirSync(pagesDir, { recursive: true })
            .filter((entry) => typeof entry === 'string' && entry.endsWith('.js')).length;
    } catch {
        pagesJsCount = null;
    }

    let zipStat: FileStat | null = null;
    if (zipPath) {
        zipStat = statFile(zipPath);
    }

    let manifestContentScripts: string[] = [];
    try {
        manifestContentScripts = readManifestContentScriptPaths(extensionPath);
    } catch (error: unknown) {
        manifestContentScripts = [`<manifest read failed: ${error instanceof Error ? error.message : String(error)}>`];
    }

    const missingFromDisk = manifestContentScripts.filter((scriptPath) => {
        return !statFile(path.join(extensionPath, scriptPath)).exists;
    });

    logE2EDiagnostic('A', 'diagnostics.ts:logExtensionArtifactDiagnostics', 'extension artifact inspection', {
        matrixId,
        extensionPath,
        zipPath: zipPath ?? null,
        zipStat,
        pagesJsCount,
        watchedFiles,
        manifestContentScripts,
        manifestScriptsMissingOnDisk: missingFromDisk,
        cwd: process.cwd(),
    });
};

/**
 * Logs WebDriver/Firefox environment (hypothesis B: version or headless differences).
 *
 * @param matrixId E2E matrix id.
 * @param driver Selenium WebDriver.
 * @param extensionId Firefox extension id from manifest.
 * @param extensionPath Path passed to installAddon.
 */
export const logFirefoxEnvironmentDiagnostics = async (
    matrixId: string,
    driver: WebDriver,
    extensionId: string,
    extensionPath: string,
): Promise<void> => {
    let capabilities: Record<string, unknown> = {};

    try {
        const raw = await driver.getCapabilities();
        if (typeof (raw as { get?: (key: string) => unknown }).get === 'function') {
            const map = raw as { get: (key: string) => unknown };
            capabilities = {
                browserName: map.get('browserName'),
                browserVersion: map.get('browserVersion'),
                platformName: map.get('platformName'),
                'moz:geckodriverVersion': map.get('moz:geckodriverVersion'),
                acceptInsecureCerts: map.get('acceptInsecureCerts'),
            };
        } else {
            capabilities = raw as unknown as Record<string, unknown>;
        }
    } catch (error: unknown) {
        capabilities = { readError: error instanceof Error ? error.message : String(error) };
    }

    logE2EDiagnostic('B', 'diagnostics.ts:logFirefoxEnvironmentDiagnostics', 'firefox session environment', {
        matrixId,
        extensionId,
        extensionPath,
        e2eHeadless: process.env.E2E_HEADLESS !== 'false',
        nodeVersion: process.version,
        platform: process.platform,
        capabilities,
    });
};

/**
 * Logs open tab URLs from the extension context (hypothesis C: injection on unexpected tabs).
 *
 * @param matrixId E2E matrix id.
 * @param driver Selenium WebDriver.
 * @param contextLabel Human-readable step label.
 */
export const logFirefoxOpenTabsDiagnostics = async (
    matrixId: string,
    driver: WebDriver,
    contextLabel: string,
): Promise<void> => {
    let tabs: unknown = null;

    try {
        tabs = await driver.executeAsyncScript(
            'var cb = arguments[arguments.length - 1];'
            + 'browser.tabs.query({})'
            + '.then(function(result) { cb(result); })'
            + '.catch(function(err) { cb({ error: String(err) }); });',
        );
    } catch (error: unknown) {
        tabs = { queryError: error instanceof Error ? error.message : String(error) };
    }

    logE2EDiagnostic('C', 'diagnostics.ts:logFirefoxOpenTabsDiagnostics', 'open tabs snapshot', {
        matrixId,
        contextLabel,
        tabs,
    });
};

/**
 * Logs background error filtering (hypothesis D: benign filter vs real failures).
 *
 * @param matrixId E2E matrix id.
 * @param contextLabel Test step label.
 * @param backgroundCursor Collector cursor at step start.
 * @param rawErrors Errors before benign filtering.
 * @param filteredErrors Errors after benign filtering.
 */
export const logBackgroundErrorsDiagnostics = (
    matrixId: string,
    contextLabel: string,
    backgroundCursor: number,
    rawErrors: E2EError[],
    filteredErrors: E2EError[],
): void => {
    const filteredOut = rawErrors.filter((error) => !filteredErrors.includes(error));

    logE2EDiagnostic('D', 'diagnostics.ts:logBackgroundErrorsDiagnostics', 'background errors slice', {
        matrixId,
        contextLabel,
        backgroundCursor,
        rawCount: rawErrors.length,
        filteredCount: filteredErrors.length,
        benignFilteredCount: filteredOut.length,
        rawErrors,
        filteredOut,
    });
};

/**
 * Logs a single BiDi javascript exception as it arrives (hypothesis E: timing/order).
 *
 * @param matrixId E2E matrix id.
 * @param message Exception text.
 * @param realmId BiDi realm id.
 */
export const logFirefoxJavascriptExceptionDiagnostic = (
    matrixId: string,
    message: string,
    realmId: string,
): void => {
    logE2EDiagnostic('E', 'diagnostics.ts:logFirefoxJavascriptException', 'firefox bidi javascript exception', {
        matrixId,
        message,
        realmId,
    });
};
