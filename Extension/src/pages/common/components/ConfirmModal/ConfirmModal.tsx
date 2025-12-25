/**
 * Copyright (c) 2015-2025 Adguard Software Ltd.
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

import React from 'react';
import Modal from 'react-modal';

import cn from 'classnames';

import { translator } from '../../../../common/translators/translator';
import { Icon } from '../ui/Icon';
import theme from '../../styles/theme';

type ConfirmModalParams = {
    /**
     * Modal title.
     */
    title: string;

    /**
     * Modal subtitle.
     */
    subtitle?: string | React.ReactNode;

    /**
     * Modal visibility flag.
     */
    isOpen: boolean;

    /**
     * Confirm button click handler.
     */
    onConfirm: () => void;

    /**
     * Cancel button click handler.
     */
    onCancel?: () => void;

    /**
     * Modal visibility flag setter.
     */
    setIsOpen: (isOpen: boolean) => void;

    /**
     * Custom confirm button title.
     */
    customConfirmTitle?: string;

    /**
     * Custom cancel button title.
     */
    customCancelTitle?: string;

    /**
     * Flag to show consent modal.
     */
    isConsent?: boolean;

    /**
     * Flag to make modal content scrollable. Default is false.
     */
    isScrollable?: boolean;

    /**
     * Flag to hide optional button. Default is false.
     */
    isOptionalBtnHidden?: boolean;
};

export const ConfirmModal = ({
    title,
    subtitle,
    isOpen,
    onConfirm,
    onCancel,
    setIsOpen,
    customConfirmTitle,
    customCancelTitle,
    isConsent,
    isScrollable = false,
    isOptionalBtnHidden = false,
}: ConfirmModalParams) => {
    const confirmTitle = customConfirmTitle || 'OK';
    const cancelTitle = customCancelTitle || translator.getMessage('options_confirm_modal_cancel_button');

    const subtitleClassName = cn(
        theme.modal.subtitle,
        !isConsent && theme.modal.subtitleOneLine,
    );

    const okBtnClassName = cn(`button button--l ${theme.modal.btn} button--green-bg ${theme.modal.btnOk}`, {
        'button--red-bg': !isConsent,
    });

    const closeModal = () => {
        setIsOpen(false);
    };

    const handleConfirm = () => {
        closeModal();
        onConfirm();
    };

    const handleCancel = () => {
        closeModal();
        if (onCancel) {
            onCancel();
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={handleCancel}
            overlayClassName={theme.modal.overlay}
            className={theme.modal.wrapper}
        >
            <div
                // 'modalScrollable' is needed for ':has(.modalScrollable)' selector to work
                // and for scrollbar to display properly (AG-34984)
                className={cn(
                    theme.modal.modal,
                    isScrollable && theme.modal.modalScrollable,
                )}
            >
                <div className={theme.modal.content}>
                    <button
                            type="button"
                            className={`button ${theme.modal.btnClose}`}
                            title={translator.getMessage('close_button_title')}
                            onClick={handleCancel}
                        >
                            <Icon id="#cross" aria-hidden="true" />
                        </button>
                    <div className={theme.modal.header}>
                        <div className={theme.modal.title}>
                            {title}
                        </div>
                    </div>
                    {subtitle && (
                        <div
                            className={subtitleClassName}
                        >
                            {subtitle}
                        </div>
                    )}
                </div>
                <div className={theme.modal.actions}>
                    <button
                        className={okBtnClassName}
                        type="button"
                        onClick={handleConfirm}
                        title={confirmTitle}
                    >
                        {confirmTitle}
                    </button>
                    <button
                        className={cn(
                            'button button--l',
                            'button--transparent',
                            theme.modal.btn,
                            isOptionalBtnHidden && theme.modal.optionalBtn,
                        )}
                        type="button"
                        onClick={handleCancel}
                        title={cancelTitle}
                    >
                        {cancelTitle}
                    </button>
                </div>
            </div>
        </Modal>
    );
};
