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

export enum BrowserSyncAction {
    PreviewUpload = 'preview-upload',
    PreviewDownload = 'preview-download',
    PreviewDelete = 'preview-delete',
    Confirm = 'confirm',
}

export enum BrowserSyncError {
    Consent = 'consent',
    Unavailable = 'unavailable',
    Invalid = 'invalid',
    Empty = 'empty',
    Quota = 'quota',
    Conflict = 'conflict',
    Busy = 'busy',
    Storage = 'storage',
    Apply = 'apply',
    Managed = 'managed',
    Forbidden = 'forbidden',
}

/** Only presentation preferences; never protection, permissions, or browsing data. */
export type BrowserSyncPreferences = {
    'appearance-theme': 'system' | 'light' | 'dark';
    'disable-show-page-statistic': boolean;
    'user-rules-editor-wrap': boolean;
};

export type BrowserSyncRequest = {
    action: BrowserSyncAction;
    consent: boolean;
    token?: string;
};

export type BrowserSyncPreview = {
    token: string;
    action: Exclude<BrowserSyncAction, BrowserSyncAction.Confirm>;
    local: BrowserSyncPreferences;
    remote: BrowserSyncPreferences | null;
    remoteExists: boolean;
};

export type BrowserSyncResponse =
    | { ok: true; preview: BrowserSyncPreview }
    | { ok: true; completed: BrowserSyncAction }
    | { ok: false; error: BrowserSyncError };
