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

import React, { useRef, useState } from 'react';

import {
    BrowserSyncAction,
    BrowserSyncError,
    type BrowserSyncPreferences,
    type BrowserSyncPreview,
} from '../../../../common/browser-sync';
import { translator } from '../../../../common/translators/translator';
import { messenger } from '../../../services/messenger';
import { SettingsSection } from '../Settings/SettingsSection';
import { ConfirmModal } from '../../../common/components/ConfirmModal';

const ERROR_MESSAGES: Record<BrowserSyncError, string> = {
    [BrowserSyncError.Consent]: 'options_browser_sync_error_consent',
    [BrowserSyncError.Unavailable]: 'options_browser_sync_error_unavailable',
    [BrowserSyncError.Invalid]: 'options_browser_sync_error_invalid',
    [BrowserSyncError.Empty]: 'options_browser_sync_error_empty',
    [BrowserSyncError.Quota]: 'options_browser_sync_error_quota',
    [BrowserSyncError.Conflict]: 'options_browser_sync_error_conflict',
    [BrowserSyncError.Busy]: 'options_browser_sync_error_busy',
    [BrowserSyncError.Storage]: 'options_browser_sync_error_storage',
    [BrowserSyncError.Apply]: 'options_browser_sync_error_apply',
    [BrowserSyncError.Managed]: 'options_browser_sync_error_managed',
    [BrowserSyncError.Forbidden]: 'options_browser_sync_error_forbidden',
};

const PREFERENCE_LABELS: Record<keyof BrowserSyncPreferences, string> = {
    'appearance-theme': 'options_select_theme',
    'disable-show-page-statistic': 'options_browser_sync_hide_count',
    'user-rules-editor-wrap': 'options_browser_sync_wrap_rules',
};

const formatValue = (value: BrowserSyncPreferences[keyof BrowserSyncPreferences]) => {
    if (typeof value === 'boolean') {
        return translator.getMessage(value ? 'options_browser_sync_yes' : 'options_browser_sync_no');
    }
    return translator.getMessage(`options_theme_selector_${value}`);
};

/** Manual transfer controls: no storage access on mount and no background synchronization. */
export const BrowserSync = () => {
    const [consent, setConsent] = useState(false);
    const [busy, setBusy] = useState(false);
    const busyRef = useRef(false);
    const [preview, setPreview] = useState<BrowserSyncPreview | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [status, setStatus] = useState('');

    const run = async (action: BrowserSyncAction, token?: string) => {
        if (busyRef.current) {
            return;
        }
        busyRef.current = true;
        setBusy(true);
        setPreview(null);
        setError(null);
        setStatus('');
        try {
            const result = await messenger.browserSync({ action, token, consent });
            if (!result.ok) {
                setError(translator.getMessage(ERROR_MESSAGES[result.error]));
            } else if ('preview' in result) {
                setPreview(result.preview);
            } else {
                const success = {
                    [BrowserSyncAction.PreviewUpload]: 'options_browser_sync_uploaded',
                    [BrowserSyncAction.PreviewDownload]: 'options_browser_sync_applied',
                    [BrowserSyncAction.PreviewDelete]: 'options_browser_sync_deleted',
                    [BrowserSyncAction.Confirm]: 'options_browser_sync_applied',
                };
                setStatus(translator.getMessage(success[result.completed]));
            }
        } catch {
            setError(translator.getMessage('options_browser_sync_error_storage'));
        } finally {
            busyRef.current = false;
            setBusy(false);
        }
    };

    const confirmTitles = {
        [BrowserSyncAction.PreviewUpload]: 'options_browser_sync_confirm_upload',
        [BrowserSyncAction.PreviewDownload]: 'options_browser_sync_confirm_apply',
        [BrowserSyncAction.PreviewDelete]: 'options_browser_sync_confirm_delete',
    };
    const confirmTitle = preview ? confirmTitles[preview.action] : 'options_browser_sync_confirm_apply';

    const review = preview && (
        <>
            <p>{translator.getMessage(confirmTitle)}</p>
            {preview.action === BrowserSyncAction.PreviewUpload && preview.remoteExists && (
                <p>{translator.getMessage('options_browser_sync_overwrite')}</p>
            )}
            <p>{translator.getMessage('options_browser_sync_review_columns')}</p>
            <ul>
                {(Object.keys(PREFERENCE_LABELS) as (keyof BrowserSyncPreferences)[]).map((key) => (
                    <li key={key}>
                        {translator.getMessage(PREFERENCE_LABELS[key])}
                        {': '}
                        {formatValue(preview.local[key])}
                        {' / '}
                        {preview.remote
                            ? formatValue(preview.remote[key])
                            : translator.getMessage('options_browser_sync_no_snapshot')}
                    </li>
                ))}
            </ul>
            <p>{translator.getMessage('options_browser_sync_review_expiry')}</p>
        </>
    );

    return (
        <SettingsSection
            title={translator.getMessage('options_browser_sync_title')}
            description={translator.getMessage('options_browser_sync_description')}
        >
            <p className="title__desc">{translator.getMessage('options_browser_sync_exclusions')}</p>
            <label className="setting__container">
                <input
                    type="checkbox"
                    checked={consent}
                    disabled={busy}
                    onChange={(event) => {
                        setConsent(event.target.checked);
                        setPreview(null);
                        setStatus('');
                        setError(null);
                    }}
                />
                {' '}
                {translator.getMessage('options_browser_sync_consent')}
            </label>
            <div className="links-menu links-menu--section" aria-busy={busy}>
                <button
                    type="button"
                    className="links-menu__item button--link--green"
                    disabled={!consent || busy}
                    onClick={() => run(BrowserSyncAction.PreviewUpload)}
                >
                    {translator.getMessage('options_browser_sync_upload')}
                </button>
                <button
                    type="button"
                    className="links-menu__item button--link--green"
                    disabled={!consent || busy}
                    onClick={() => run(BrowserSyncAction.PreviewDownload)}
                >
                    {translator.getMessage('options_browser_sync_download')}
                </button>
                <button
                    type="button"
                    className="links-menu__item button--link--green"
                    disabled={!consent || busy}
                    onClick={() => run(BrowserSyncAction.PreviewDelete)}
                >
                    {translator.getMessage('options_browser_sync_delete')}
                </button>
            </div>
            <p role="status" aria-live="polite">
                {busy ? translator.getMessage('options_browser_sync_busy') : status}
            </p>
            {error && <p role="alert">{error}</p>}
            <ConfirmModal
                isOpen={preview !== null}
                setIsOpen={(open) => {
                    if (!open) {
                        setPreview(null);
                    }
                }}
                onConfirm={() => {
                    if (preview) {
                        run(BrowserSyncAction.Confirm, preview.token);
                    }
                }}
                title={translator.getMessage('options_browser_sync_review')}
                subtitle={review}
                customConfirmTitle={translator.getMessage(confirmTitle)}
                isScrollable
            />
        </SettingsSection>
    );
};
