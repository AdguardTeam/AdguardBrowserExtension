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

// The transport and its small typed error share one module.
/* eslint-disable max-classes-per-file */

export const CLOUD_DOCUMENT_LIMIT = 16 * 1024;
const REQUEST_TIMEOUT_MS = 15000;
const DOCUMENT_NAME = 'adguard-preferences-v1.json';
const DOCUMENT_FORMAT = 'adguard-ui-preferences';

/** The deliberately small cross-browser subset. Filtering and permissions remain local. */
export type CloudPreferences = {
    'appearance-theme': 'system' | 'light' | 'dark';
    'disable-show-page-statistic': boolean;
    'context-menu-disabled': boolean;
    'user-rules-editor-wrap': boolean;
};

export const CLOUD_PREFERENCE_KEYS = [
    'appearance-theme',
    'disable-show-page-statistic',
    'context-menu-disabled',
    'user-rules-editor-wrap',
] as const;

export type CloudDocument = {
    format: typeof DOCUMENT_FORMAT;
    version: 1;
    preferences: CloudPreferences;
};

export enum CloudErrorCode {
    Invalid = 'invalid',
    Endpoint = 'endpoint',
    Credentials = 'credentials',
    Unavailable = 'unavailable',
    Network = 'network',
    Authentication = 'authentication',
    Conflict = 'conflict',
    Precondition = 'precondition',
    TooLarge = 'too_large',
    Quota = 'quota',
    Busy = 'busy',
    Inspect = 'inspect',
    LocalChanged = 'local_changed',
    Apply = 'apply',
}

/** Carries only an allowlisted code, never a URL, credential or server response. */
export class CloudSyncError extends Error {
    constructor(public readonly code: CloudErrorCode) {
        super(code);
    }
}

const object = (value: unknown): Record<string, unknown> => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        throw new CloudSyncError(CloudErrorCode.Invalid);
    }
    return value as Record<string, unknown>;
};

const exactKeys = (value: Record<string, unknown>, keys: readonly string[]): void => {
    if (Object.keys(value).length !== keys.length
        || keys.some((key) => !Object.prototype.hasOwnProperty.call(value, key))) {
        throw new CloudSyncError(CloudErrorCode.Invalid);
    }
};

export const parseCloudPreferences = (value: unknown): CloudPreferences => {
    const data = object(value);
    exactKeys(data, CLOUD_PREFERENCE_KEYS);
    if (!['system', 'light', 'dark'].includes(data['appearance-theme'] as string)
        || typeof data['disable-show-page-statistic'] !== 'boolean'
        || typeof data['context-menu-disabled'] !== 'boolean'
        || typeof data['user-rules-editor-wrap'] !== 'boolean') {
        throw new CloudSyncError(CloudErrorCode.Invalid);
    }
    // Rebuild in a stable order, without retaining the caller's mutable object.
    return {
        'appearance-theme': data['appearance-theme'] as CloudPreferences['appearance-theme'],
        'disable-show-page-statistic': data['disable-show-page-statistic'],
        'context-menu-disabled': data['context-menu-disabled'],
        'user-rules-editor-wrap': data['user-rules-editor-wrap'],
    };
};

export const selectCloudPreferences = (settings: unknown): CloudPreferences => {
    const data = object(settings);
    return parseCloudPreferences(Object.fromEntries(CLOUD_PREFERENCE_KEYS.map((key) => [key, data[key]])));
};

export const parseCloudDocument = (value: unknown): CloudDocument => {
    const data = object(value);
    exactKeys(data, ['format', 'version', 'preferences']);
    if (data.format !== DOCUMENT_FORMAT || data.version !== 1) {
        throw new CloudSyncError(CloudErrorCode.Invalid);
    }
    return { format: DOCUMENT_FORMAT, version: 1, preferences: parseCloudPreferences(data.preferences) };
};

export const createCloudDocument = (preferences: unknown): CloudDocument => ({
    format: DOCUMENT_FORMAT,
    version: 1,
    preferences: parseCloudPreferences(preferences),
});

export const equalCloudPreferences = (left: unknown, right: unknown): boolean => {
    return JSON.stringify(parseCloudPreferences(left)) === JSON.stringify(parseCloudPreferences(right));
};

/**
 * A directory URL keeps DELETE scoped to this feature's document, not an arbitrary user file.
 *
 * @param folder HTTPS WebDAV directory.
 *
 * @throws {CloudSyncError} If the URL contains credentials or unsupported components.
 */
export const cloudDocumentUrl = (folder: string): URL => {
    try {
        if (folder.length > 2048 || /[\s\\]/u.test(folder)) {
            throw new Error();
        }
        const url = new URL(folder);
        if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) {
            throw new Error();
        }
        url.pathname = `${url.pathname.replace(/\/$/, '')}/${DOCUMENT_NAME}`;
        return url;
    } catch {
        throw new CloudSyncError(CloudErrorCode.Endpoint);
    }
};

const basicAuthorization = (username: string, password: string): string => {
    if (!username || !password || username.includes(':') || username.length > 256 || password.length > 1024
        || Array.from(username + password).some((char) => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127)) {
        throw new CloudSyncError(CloudErrorCode.Credentials);
    }
    const bytes = new TextEncoder().encode(`${username}:${password}`);
    return `Basic ${btoa(Array.from(bytes, (byte) => String.fromCharCode(byte)).join(''))}`;
};

const strongEtag = (value: string | null): string => {
    if (!value || value.length > 128 || !/^"[\x21\x23-\x7e]*"$/u.test(value)) {
        throw new CloudSyncError(CloudErrorCode.Precondition);
    }
    return value;
};

const readBounded = async (response: Response): Promise<string> => {
    const length = Number(response.headers.get('Content-Length'));
    if (length > CLOUD_DOCUMENT_LIMIT) {
        throw new CloudSyncError(CloudErrorCode.TooLarge);
    }
    if (!response.body) {
        throw new CloudSyncError(CloudErrorCode.Invalid);
    }
    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8', { fatal: true });
    let size = 0;
    let text = '';
    try {
        for (;;) {
            const { done, value } = await reader.read();
            if (done) {
                return text + decoder.decode();
            }
            size += value.byteLength;
            if (size > CLOUD_DOCUMENT_LIMIT) {
                throw new CloudSyncError(CloudErrorCode.TooLarge);
            }
            text += decoder.decode(value, { stream: true });
        }
    } finally {
        reader.cancel().catch(() => {});
        reader.releaseLock();
    }
};

export type CloudSnapshot = { document: CloudDocument; etag: string };

/** Session-only credentials and preconditions. Constructing this object never makes a request. */
export class WebDavSession {
    private readonly url: URL;

    private authorization: string;

    private snapshot: CloudSnapshot | null | undefined;

    private busy = false;

    private closed = false;

    private controller: AbortController | undefined;

    constructor(folder: string, username: string, password: string) {
        this.url = cloudDocumentUrl(folder);
        this.authorization = basicAuthorization(username, password);
    }

    /** Abort in-flight requests and forget credentials when the options panel closes. */
    close(): void {
        this.closed = true;
        this.authorization = '';
        this.snapshot = undefined;
        this.controller?.abort();
    }

    private async request<T>(
        method: string,
        headers: Record<string, string>,
        consume: (response: Response) => Promise<T>,
        body?: string,
    ): Promise<T> {
        if (this.busy) {
            throw new CloudSyncError(CloudErrorCode.Busy);
        }
        if (this.closed || typeof globalThis.fetch !== 'function' || typeof AbortController !== 'function') {
            throw new CloudSyncError(CloudErrorCode.Unavailable);
        }
        this.busy = true;
        const controller = new AbortController();
        this.controller = controller;
        const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
        try {
            const response = await fetch(this.url.href, {
                method,
                headers: { Authorization: this.authorization, Accept: 'application/json', ...headers },
                body,
                credentials: 'omit',
                redirect: 'error',
                referrerPolicy: 'no-referrer',
                cache: 'no-store',
                signal: controller.signal,
            });
            if (response.redirected || (response.status >= 300 && response.status < 400)) {
                throw new CloudSyncError(CloudErrorCode.Network);
            }
            if (response.status === 401 || response.status === 403) {
                throw new CloudSyncError(CloudErrorCode.Authentication);
            }
            if (response.status === 409 || response.status === 412) {
                throw new CloudSyncError(CloudErrorCode.Conflict);
            }
            if (response.status === 413 || response.status === 507) {
                throw new CloudSyncError(CloudErrorCode.Quota);
            }
            return await consume(response);
        } catch (error) {
            this.snapshot = undefined;
            if (error instanceof CloudSyncError) {
                throw error;
            }
            throw new CloudSyncError(CloudErrorCode.Network);
        } finally {
            controller.abort();
            clearTimeout(timeout);
            this.controller = undefined;
            this.busy = false;
        }
    }

    async inspect(): Promise<CloudSnapshot | null> {
        return this.request('GET', {}, async (response) => {
            this.snapshot = undefined;
            if (response.status === 404) {
                this.snapshot = null;
                return null;
            }
            if (response.status !== 200) {
                throw new CloudSyncError(CloudErrorCode.Network);
            }
            const etag = strongEtag(response.headers.get('ETag'));
            let document: CloudDocument;
            try {
                document = parseCloudDocument(JSON.parse(await readBounded(response)));
            } catch (error) {
                if (error instanceof CloudSyncError) {
                    throw error;
                }
                throw new CloudSyncError(CloudErrorCode.Invalid);
            }
            this.snapshot = { document, etag };
            return { document: createCloudDocument(document.preferences), etag };
        });
    }

    async upload(preferences: unknown): Promise<void> {
        const body = JSON.stringify(createCloudDocument(preferences));
        if (this.snapshot === undefined) {
            throw new CloudSyncError(CloudErrorCode.Inspect);
        }
        const headers: Record<string, string> = this.snapshot === null
            ? { 'If-None-Match': '*' }
            : { 'If-Match': this.snapshot.etag };
        await this.request('PUT', { 'Content-Type': 'application/json', ...headers }, async (response) => {
            if (![200, 201, 204].includes(response.status)) {
                throw new CloudSyncError(CloudErrorCode.Network);
            }
        }, body);
        // Never automatically retry writes: a lost response leaves their outcome unknown.
        this.snapshot = undefined;
    }

    async delete(): Promise<void> {
        if (!this.snapshot) {
            throw new CloudSyncError(CloudErrorCode.Inspect);
        }
        await this.request('DELETE', { 'If-Match': this.snapshot.etag }, async (response) => {
            if (![200, 204].includes(response.status)) {
                throw new CloudSyncError(CloudErrorCode.Network);
            }
        });
        this.snapshot = undefined;
    }
}
