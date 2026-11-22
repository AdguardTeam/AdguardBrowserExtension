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
    BrowserSyncAction,
    BrowserSyncError,
    type BrowserSyncPreferences,
    type BrowserSyncPreview,
    type BrowserSyncResponse,
} from '../../../../common/browser-sync';

export const BROWSER_SYNC_KEY = 'adguard-browser-preferences-v1';
const FORMAT = 'adguard-browser-preferences';
const VERSION = 1;
const MAX_ITEM_BYTES = 8192;
const MAX_TOTAL_BYTES = 102400;
const MAX_ITEMS = 512;
const REVIEW_LIFETIME_MS = 5 * 60 * 1000;

/** The promise-based browser storage boundary. */
export type SyncStorage = {
    get: (keys: null) => Promise<Record<string, unknown>>;
    set: (items: Record<string, unknown>) => Promise<void>;
    remove: (key: string) => Promise<void>;
    QUOTA_BYTES?: number;
    QUOTA_BYTES_PER_ITEM?: number;
    MAX_ITEMS?: number;
};

/** Local settings and browser services used by manual sync. */
export type BrowserSyncDependencies = {
    storage: () => SyncStorage | undefined;
    readLocal: () => BrowserSyncPreferences;
    applyLocal: (next: BrowserSyncPreferences, expected: BrowserSyncPreferences) => Promise<void>;
    isManaged: () => Promise<boolean>;
    createToken: () => string;
};

type Snapshot = {
    format: typeof FORMAT;
    version: typeof VERSION;
    revision: string;
    preferences: BrowserSyncPreferences;
};

type PendingReview = {
    preview: BrowserSyncPreview;
    remoteFingerprint: string | undefined;
    expiresAt: number;
};

/**
 * Tests a plain JSON object without accepting arrays or null.
 *
 * @param value Untrusted value.
 *
 * @returns Whether the value is an object.
 */
const isRecord = (value: unknown): value is Record<string, unknown> => {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
};

/**
 * Validates all transferable preferences, rejecting additional keys.
 *
 * @param value Untrusted preferences.
 *
 * @returns Whether all three presentation preferences are valid.
 */
export const isBrowserSyncPreferences = (value: unknown): value is BrowserSyncPreferences => {
    return isRecord(value)
        && Object.keys(value).length === 3
        && ['system', 'light', 'dark'].includes(value['appearance-theme'] as string)
        && typeof value['disable-show-page-statistic'] === 'boolean'
        && typeof value['user-rules-editor-wrap'] === 'boolean';
};

/**
 * Measures storage items using UTF-8, including their keys.
 *
 * @param key Storage key.
 * @param value JSON value.
 *
 * @returns Encoded byte count.
 */
const itemBytes = (key: string, value: unknown): number => {
    return new TextEncoder().encode(key + JSON.stringify(value)).byteLength;
};

/**
 * Validates the versioned snapshot before it can reach local settings.
 *
 * @param value Untrusted stored snapshot.
 *
 * @returns Whether the snapshot is compatible and bounded.
 */
const isSnapshot = (value: unknown): value is Snapshot => {
    return isRecord(value)
        && Object.keys(value).length === 4
        && value.format === FORMAT
        && value.version === VERSION
        && typeof value.revision === 'string'
        && value.revision.length > 0 && value.revision.length <= 128
        && isBrowserSyncPreferences(value.preferences)
        && itemBytes(BROWSER_SYNC_KEY, value) <= MAX_ITEM_BYTES;
};

/**
 * Compares preferences independently of JSON property ordering.
 *
 * @param left First set of preferences.
 * @param right Second set of preferences.
 *
 * @returns Whether all transferable values match.
 */
export const sameBrowserSyncPreferences = (
    left: BrowserSyncPreferences,
    right: BrowserSyncPreferences,
): boolean => {
    return left['appearance-theme'] === right['appearance-theme']
        && left['disable-show-page-statistic'] === right['disable-show-page-statistic']
        && left['user-rules-editor-wrap'] === right['user-rules-editor-wrap'];
};

/** Manual sync state machine; construction and extension startup perform no I/O. */
export class BrowserSyncController {
    /** External storage and settings boundaries. */
    private readonly dependencies: BrowserSyncDependencies;

    /** One background-owned review, invalidated on restart or a newer preview. */
    private pending: PendingReview | undefined;

    /** Reject concurrent requests rather than queueing stale confirmations. */
    private busy = false;

    /**
     * Creates an idle sync controller.
     *
     * @param dependencies Browser and local settings boundaries.
     */
    constructor(dependencies: BrowserSyncDependencies) {
        this.dependencies = dependencies;
    }

    /**
     * Executes an explicitly consented preview or consumes its confirmation.
     *
     * @param request Untrusted message data.
     *
     * @returns A preview, completion, or actionable error code.
     */
    public async handle(request: unknown): Promise<BrowserSyncResponse> {
        if (this.busy) {
            return { ok: false, error: BrowserSyncError.Busy };
        }
        this.busy = true;
        try {
            if (!isRecord(request) || request.consent !== true) {
                this.pending = undefined;
                return { ok: false, error: BrowserSyncError.Consent };
            }
            if (!Object.values(BrowserSyncAction).includes(request.action as BrowserSyncAction)) {
                this.pending = undefined;
                return { ok: false, error: BrowserSyncError.Invalid };
            }
            const storage = this.dependencies.storage();
            if (!storage) {
                this.pending = undefined;
                return { ok: false, error: BrowserSyncError.Unavailable };
            }
            const pending = this.pending;
            this.pending = undefined;
            if (request.action === BrowserSyncAction.Confirm) {
                if (!pending || request.token !== pending.preview.token || Date.now() > pending.expiresAt) {
                    return { ok: false, error: BrowserSyncError.Conflict };
                }
                return await this.confirm(storage, pending);
            }
            const action = request.action as BrowserSyncPreview['action'];
            if (action !== BrowserSyncAction.PreviewDelete && await this.dependencies.isManaged()) {
                return { ok: false, error: BrowserSyncError.Managed };
            }
            const items = await storage.get(null);
            const remote = items[BROWSER_SYNC_KEY];
            const remoteExists = Object.prototype.hasOwnProperty.call(items, BROWSER_SYNC_KEY);
            if (action === BrowserSyncAction.PreviewDownload) {
                if (!remoteExists) {
                    return { ok: false, error: BrowserSyncError.Empty };
                }
                if (!isSnapshot(remote)) {
                    return { ok: false, error: BrowserSyncError.Invalid };
                }
            }
            const local = this.dependencies.readLocal();
            if (!isBrowserSyncPreferences(local)) {
                return { ok: false, error: BrowserSyncError.Invalid };
            }
            const preview: BrowserSyncPreview = {
                token: this.dependencies.createToken(),
                action,
                local: { ...local },
                remote: isSnapshot(remote) ? { ...remote.preferences } : null,
                remoteExists,
            };
            this.pending = {
                preview,
                remoteFingerprint: JSON.stringify(remote),
                expiresAt: Date.now() + REVIEW_LIFETIME_MS,
            };
            return { ok: true, preview: structuredClone(preview) };
        } catch {
            this.pending = undefined;
            return { ok: false, error: BrowserSyncError.Storage };
        } finally {
            this.busy = false;
        }
    }

    /**
     * Rechecks both sides and policy immediately before a confirmed operation.
     *
     * @param storage Browser sync storage.
     * @param pending Background-owned review, never supplied by the page.
     *
     * @returns Completion or a conflict/failure with no implicit retry.
     */
    private async confirm(storage: SyncStorage, pending: PendingReview): Promise<BrowserSyncResponse> {
        const { preview } = pending;
        if (preview.action !== BrowserSyncAction.PreviewDelete && await this.dependencies.isManaged()) {
            return { ok: false, error: BrowserSyncError.Managed };
        }
        const items = await storage.get(null);
        if (JSON.stringify(items[BROWSER_SYNC_KEY]) !== pending.remoteFingerprint
            || !sameBrowserSyncPreferences(this.dependencies.readLocal(), preview.local)) {
            return { ok: false, error: BrowserSyncError.Conflict };
        }
        if (preview.action === BrowserSyncAction.PreviewDelete) {
            await storage.remove(BROWSER_SYNC_KEY);
        } else if (preview.action === BrowserSyncAction.PreviewDownload) {
            if (!preview.remote) {
                return { ok: false, error: BrowserSyncError.Invalid };
            }
            try {
                await this.dependencies.applyLocal(preview.remote, preview.local);
            } catch {
                return { ok: false, error: BrowserSyncError.Apply };
            }
        } else {
            const snapshot: Snapshot = {
                format: FORMAT,
                version: VERSION,
                revision: this.dependencies.createToken(),
                preferences: preview.local,
            };
            const next = { ...items, [BROWSER_SYNC_KEY]: snapshot };
            const bytes = Object.entries(next).reduce((total, [key, value]) => total + itemBytes(key, value), 0);
            const itemLimit = Math.min(storage.QUOTA_BYTES_PER_ITEM ?? MAX_ITEM_BYTES, MAX_ITEM_BYTES);
            if (itemBytes(BROWSER_SYNC_KEY, snapshot) > itemLimit
                || bytes > Math.min(storage.QUOTA_BYTES ?? MAX_TOTAL_BYTES, MAX_TOTAL_BYTES)
                || Object.keys(next).length > Math.min(storage.MAX_ITEMS ?? MAX_ITEMS, MAX_ITEMS)) {
                return { ok: false, error: BrowserSyncError.Quota };
            }
            // storage.sync has no compare-and-swap; other devices can still race this write.
            await storage.set({ [BROWSER_SYNC_KEY]: snapshot });
        }
        return { ok: true, completed: preview.action };
    }
}
