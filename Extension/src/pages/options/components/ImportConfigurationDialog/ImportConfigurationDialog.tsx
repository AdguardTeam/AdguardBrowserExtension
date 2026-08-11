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

import React, { useEffect, useState } from 'react';
import Modal from 'react-modal';

import { translator } from '../../../../common/translators/translator';
import { messenger } from '../../../services/messenger';
import { ModalContentWrapper } from '../../../common/components/ModalContentWrapper/ModalContentWrapper';
import importSuccessImage from '../../../../../assets/images/import_success.svg';
import importErrorImage from '../../../../../assets/images/import_error.svg';
import { logger } from '../../../../common/logger';
import { ensurePermission } from '../../ensure-permission';

import theme from '../../../common/styles/theme';

/**
 * Possible states of the import configuration dialog.
 */
const enum DialogState {
    Idle = 'idle',
    Confirm = 'confirm',
    Applying = 'applying',
    Success = 'success',
    Error = 'error',
}

/**
 * Dialog that handles the multi-state import configuration flow.
 *
 * States:
 * - `idle`    — no pending import; dialog is closed.
 * - `confirm` — shows the confirmation screen with what will be changed.
 * - `applying`— shows a spinner while the background applies settings.
 * - `success` — shows a success message.
 * - `error`   — shows an error message.
 */
export const ImportConfigurationDialog = () => {
    const [state, setState] = useState<DialogState>(DialogState.Idle);
    const [pendingBlockWebrtc, setPendingBlockWebrtc] = useState(false);

    useEffect(() => {
        const checkForPendingImport = async () => {
            try {
                const isPending = await messenger.isPendingForImport();

                if (isPending) {
                    const blockWebrtc = await messenger.getPendingImportBlockWebrtc();
                    setPendingBlockWebrtc(blockWebrtc);
                    setState(DialogState.Confirm);
                }
            } catch (error) {
                logger.error('[ext.ImportConfigurationDialog]: failed to check for pending import', error);
            }
        };

        checkForPendingImport();

        // Re-check on focus because the settings page may already be open when the user
        // triggers a second import. In that case the background sets a new pendingImportConfig
        // and focuses the existing tab instead of opening a new one, so the component is never
        // remounted and the initial check above does not run again.
        const handleFocus = () => {
            setState((current) => {
                if (current === DialogState.Idle) {
                    checkForPendingImport();
                }

                return current;
            });
        };

        window.addEventListener('focus', handleFocus);

        return () => {
            window.removeEventListener('focus', handleFocus);
        };
    }, []);

    const handleConfirm = async () => {
        // ensurePermission must be the first await in this user-gesture handler.
        // browser.permissions.request() loses the gesture context after any
        // unrelated async round-trip to the background.
        try {
            const permissionGranted = await ensurePermission(pendingBlockWebrtc);

            if (!permissionGranted) {
                await messenger.cancelImportConfiguration();
                setState(DialogState.Error);
                return;
            }
        } catch (error) {
            logger.error('[ext.ImportConfigurationDialog]: failed to check WebRTC permission', error);
            setState(DialogState.Error);
            return;
        }

        setState(DialogState.Applying);

        try {
            const success = await messenger.applyImportConfiguration();
            setState(success ? DialogState.Success : DialogState.Error);
        } catch {
            setState(DialogState.Error);
        }
    };

    const handleCancel = async () => {
        try {
            await messenger.cancelImportConfiguration();
        } catch {
            // ignore
        }

        setState(DialogState.Idle);
    };

    const handleClose = async () => {
        if (state === DialogState.Error) {
            try {
                await messenger.cancelImportConfiguration();
            } catch {
                // ignore
            }
        }

        setState(DialogState.Idle);
    };

    const isOpen = state !== DialogState.Idle;

    if (!isOpen) {
        return null;
    }

    const getTitle = (): string => {
        switch (state) {
            case DialogState.Applying:
                return translator.getMessage('options_import_configuration_applying_title');
            case DialogState.Success:
                return translator.getMessage('options_import_configuration_success_title');
            case DialogState.Error:
                return translator.getMessage('options_import_configuration_error_title');
            case DialogState.Confirm:
            default:
                return translator.getMessage('options_import_configuration_confirm_title');
        }
    };

    const renderBody = () => {
        switch (state) {
            case DialogState.Applying:
                return translator.getMessage('options_import_configuration_applying_subtitle');
            case DialogState.Success:
                return translator.getMessage('options_import_configuration_success_subtitle');
            case DialogState.Error:
                return translator.getMessage('options_import_configuration_error_subtitle');
            case DialogState.Confirm:
            default:
                return translator.getMessage('options_import_configuration_confirm_subtitle');
        }
    };

    const renderActions = () => {
        if (state === DialogState.Applying) {
            return null;
        }

        if (state === DialogState.Success) {
            return (
                <button
                    type="button"
                    className={`button button--l button--green-bg ${theme.modal.btn}`}
                    onClick={handleClose}
                >
                    {translator.getMessage('options_import_configuration_success_button')}
                </button>
            );
        }

        if (state === DialogState.Error) {
            return (
                <button
                    type="button"
                    className={`button button--l button--green-bg ${theme.modal.btn}`}
                    onClick={handleClose}
                >
                    {translator.getMessage('options_import_configuration_error_button')}
                </button>
            );
        }

        return (
            <>
                <button
                    type="button"
                    className={`button button--l button--green-bg ${theme.modal.btn}`}
                    onClick={handleConfirm}
                >
                    {translator.getMessage('options_import_configuration_confirm_button')}
                </button>
                <button
                    type="button"
                    className={`button button--l button--transparent ${theme.modal.btn}`}
                    onClick={handleCancel}
                >
                    {translator.getMessage('options_confirm_modal_cancel_button')}
                </button>
            </>
        );
    };

    const getImage = () => {
        if (state === DialogState.Success) {
            return (
                <img
                    src={importSuccessImage}
                    alt={translator.getMessage('options_import_configuration_success_title')}
                />
            );
        }
        if (state === DialogState.Error) {
            return (
                <img
                    src={importErrorImage}
                    alt={translator.getMessage('options_import_configuration_error_title')}
                />
            );
        }
        return undefined;
    };

    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={state === DialogState.Success || state === DialogState.Error ? handleClose : handleCancel}
            overlayClassName={theme.modal.overlay}
            className={theme.modal.wrapper}
        >
            <ModalContentWrapper
                closeModalHandler={state === DialogState.Confirm ? handleCancel : handleClose}
                title={getTitle()}
                actions={renderActions()}
                showCloseButton={state !== DialogState.Applying}
                image={getImage()}
            >
                {renderBody()}
            </ModalContentWrapper>
        </Modal>
    );
};
