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

import React, {
    useEffect,
    useRef,
    useState,
} from 'react';

import browser from 'webextension-polyfill';

import {
    CLOUD_PREFERENCE_KEYS,
    CloudErrorCode,
    CloudSyncError,
    WebDavSession,
    cloudDocumentUrl,
    type CloudPreferences,
    type CloudSnapshot,
} from '../../../../common/cloud-sync';
import { translator } from '../../../../common/translators/translator';
import { messenger } from '../../../services/messenger';
import { SettingsSection } from '../Settings/SettingsSection';

import './cloud-sync.pcss';

const message = (key: string): string => translator.getMessage(`options_cloud_${key}`);

type Preview = { local: CloudPreferences; remote: CloudSnapshot | null };

/** Manual cloud transfer. No credentials, previews or endpoint are persisted. */
export const CloudSync = () => {
    const [enabled, setEnabled] = useState(false);
    const [folder, setFolder] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [connected, setConnected] = useState(false);
    const [preview, setPreview] = useState<Preview | null>(null);
    const [busy, setBusy] = useState(false);
    const [status, setStatus] = useState('');
    const [deleteConfirmed, setDeleteConfirmed] = useState(false);
    const session = useRef<WebDavSession | null>(null);
    const active = useRef(false);
    const mounted = useRef(true);

    useEffect(() => {
        mounted.current = true;
        return () => {
            mounted.current = false;
            session.current?.close();
            session.current = null;
        };
    }, []);

    const disconnect = () => {
        session.current?.close();
        session.current = null;
        setPassword('');
        setUsername('');
        setFolder('');
        setPreview(null);
        setDeleteConfirmed(false);
        setConnected(false);
        setStatus('');
    };

    const run = async (action: () => Promise<void>) => {
        if (active.current) {
            return;
        }
        active.current = true;
        setBusy(true);
        setStatus('');
        try {
            await action();
        } catch (error) {
            if (mounted.current) {
                setPreview(null);
                setDeleteConfirmed(false);
                setStatus(message(`error_${error instanceof CloudSyncError ? error.code : CloudErrorCode.Unavailable}`));
            }
        } finally {
            active.current = false;
            if (mounted.current) {
                setBusy(false);
            }
        }
    };

    const connect = () => run(async () => {
        const url = cloudDocumentUrl(folder);
        const candidate = new WebDavSession(folder, username, password);
        try {
            // First async operation preserves Firefox's user-gesture permission requirement.
            const granted = await browser.permissions.request({ origins: [`https://${url.hostname}/*`] });
            if (!granted || !mounted.current) {
                throw new CloudSyncError(CloudErrorCode.Unavailable);
            }
            session.current = candidate;
            setPassword('');
            setConnected(true);
            setStatus(message('connected'));
        } catch {
            candidate.close();
            throw new CloudSyncError(CloudErrorCode.Unavailable);
        }
    });

    const inspect = () => run(async () => {
        setPreview(null);
        setDeleteConfirmed(false);
        const dav = session.current;
        if (!dav) {
            throw new CloudSyncError(CloudErrorCode.Unavailable);
        }
        const local = await messenger.getCloudPreferences();
        if (!local) {
            throw new CloudSyncError(CloudErrorCode.Unavailable);
        }
        const remote = await dav.inspect();
        if (mounted.current) {
            setPreview({ local, remote });
            setStatus(message(remote ? 'preview_ready' : 'not_found'));
        }
    });

    const upload = () => run(async () => {
        if (!preview || !session.current) {
            throw new CloudSyncError(CloudErrorCode.Inspect);
        }
        // Upload exactly the local snapshot shown in the preview, not an unseen later edit.
        await session.current.upload(preview.local);
        if (mounted.current) {
            setPreview(null);
            setStatus(message('uploaded'));
        }
    });

    const apply = () => run(async () => {
        if (!preview?.remote) {
            throw new CloudSyncError(CloudErrorCode.Inspect);
        }
        const result = await messenger.applyCloudPreferences({
            expected: preview.local,
            incoming: preview.remote.document.preferences,
        });
        if (!result.ok) {
            throw new CloudSyncError(result.code);
        }
        if (mounted.current) {
            setPreview(null);
            setStatus(message('applied'));
        }
    });

    const deleteRemote = () => run(async () => {
        if (!preview?.remote || !deleteConfirmed || !session.current) {
            throw new CloudSyncError(CloudErrorCode.Inspect);
        }
        await session.current.delete();
        if (mounted.current) {
            setPreview(null);
            setDeleteConfirmed(false);
            setStatus(message('deleted'));
        }
    });

    return (
        <SettingsSection title={message('title')} description={message('description')} className="cloud-sync">
            <label>
                <input
                    type="checkbox"
                    checked={enabled}
                    disabled={busy}
                    onChange={(event) => {
                        disconnect();
                        setEnabled(event.target.checked);
                    }}
                />
                {message('enable')}
            </label>
            {enabled && (
                <>
                    <p>{message('privacy')}</p>
                    <p>{message('folder_help')}</p>
                    <fieldset disabled={busy || connected}>
                        <label htmlFor="cloud-folder">{message('folder')}</label>
                        <input
                            id="cloud-folder"
                            type="url"
                            value={folder}
                            maxLength={2048}
                            autoComplete="off"
                            onChange={(event) => setFolder(event.target.value)}
                        />
                        <label htmlFor="cloud-username">{message('username')}</label>
                        <input
                            id="cloud-username"
                            value={username}
                            maxLength={256}
                            autoComplete="off"
                            onChange={(event) => setUsername(event.target.value)}
                        />
                        <label htmlFor="cloud-password">{message('password')}</label>
                        <input
                            id="cloud-password"
                            type="password"
                            value={password}
                            maxLength={1024}
                            autoComplete="off"
                            onChange={(event) => setPassword(event.target.value)}
                        />
                    </fieldset>
                    <div className="cloud-sync__actions">
                        {!connected && (
                            <button type="button" className="button" disabled={busy} onClick={connect}>
                                {message('connect')}
                            </button>
                        )}
                        {connected && (
                            <>
                                <button type="button" className="button" disabled={busy} onClick={inspect}>
                                    {message('inspect')}
                                </button>
                                <button type="button" className="button" disabled={busy} onClick={disconnect}>
                                    {message('disconnect')}
                                </button>
                            </>
                        )}
                    </div>
                    {preview && (
                        <>
                            <dl className="cloud-sync__preview">
                                {CLOUD_PREFERENCE_KEYS.map((key) => (
                                    <div key={key}>
                                        <dt>{message(key.replace(/-/g, '_'))}</dt>
                                        <dd>
                                            {message('local')}
                                            {': '}
                                            {String(preview.local[key])}
                                        </dd>
                                        <dd>
                                            {message('remote')}
                                            {': '}
                                            {preview.remote
                                                ? String(preview.remote.document.preferences[key]) : message('absent')}
                                        </dd>
                                    </div>
                                ))}
                            </dl>
                            <div className="cloud-sync__actions">
                                <button type="button" className="button" disabled={busy} onClick={upload}>
                                    {message(preview.remote ? 'replace' : 'upload')}
                                </button>
                                {preview.remote && (
                                    <button type="button" className="button" disabled={busy} onClick={apply}>
                                        {message('apply')}
                                    </button>
                                )}
                            </div>
                            {preview.remote && (
                                <>
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={deleteConfirmed}
                                            disabled={busy}
                                            onChange={(event) => setDeleteConfirmed(event.target.checked)}
                                        />
                                        {message('delete_confirm')}
                                    </label>
                                    <button
                                        type="button"
                                        className="button"
                                        disabled={busy || !deleteConfirmed}
                                        onClick={deleteRemote}
                                    >
                                        {message('delete')}
                                    </button>
                                </>
                            )}
                        </>
                    )}
                    <p>{message('other_providers')}</p>
                    <p role="status" aria-live="polite">{busy ? message('working') : status}</p>
                </>
            )}
        </SettingsSection>
    );
};
