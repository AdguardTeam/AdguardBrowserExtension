/**
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

type ConfirmModalParams = {
    /**
     * Modal title.
     */
    title: string,

    /**
     * Modal subtitle.
     */
    subtitle?: string,

    /**
     * Modal visibility flag.
     */
    isOpen: boolean,

    /**
     * Confirm button click handler.
     */
    onConfirm: () => void,

    /**
     * Cancel button click handler.
     */
    onCancel?: () => void,

    /**
     * Modal visibility flag setter.
     */
    setIsOpen: (isOpen: boolean) => void,

    /**
     * Custom confirm button title.
     */
    customConfirmTitle?: string,

    /**
     * Custom cancel button title.
     */
    customCancelTitle?: string,

    /**
     * Flag to show consent modal.
     */
    isConsent?: boolean,

    /**
     * Flag to make modal content scrollable. Default is false.
     */
    isScrollable?: boolean,
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
}: ConfirmModalParams) => {
    const confirmTitle = customConfirmTitle || 'OK';
    const cancelTitle = customCancelTitle || translator.getMessage('options_confirm_modal_cancel_button');

    const subtitleClassName = cn('modal__subtitle', {
        'modal__subtitle--one-line': !isConsent,
    });

    const okBtnClassName = cn('button button--l modal__btn button--green-bg', {
        'button--red-bg': !isConsent,
    });

    React.useEffect(() => {
        // Remove the blur since Modal component handles focus management
        if (isOpen) {
            // The Modal component will handle focus management with shouldReturnFocusAfterClose
        }
    }, [isOpen]);

    const focusMainContent = () => {
        const mainContent = document.querySelector('[role="main"]') as HTMLElement;
        if (mainContent) {
            mainContent.focus();
            // If there's a title in the main content, focus it instead
            const title = mainContent.querySelector('h1, h2, .title') as HTMLElement;
            if (title) {
                title.focus();
            }
        }
    };

    const closeModal = () => {
        setIsOpen(false);
        // Add a small delay to ensure the new content is rendered
        setTimeout(focusMainContent, 100);
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
            style={{
                content: {
                    padding: 0,
                    borderRadius: 8,
                },
            }}
            shouldReturnFocusAfterClose
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
        >
            <div
                // 'modal--scrollable' is needed for ':has(.modal--scrollable)' selector to work
                // and for scrollbar to display properly (AG-34984)
                className={cn('modal', {
                    'modal--scrollable': isScrollable,
                })}
                tabIndex={-1}
            >
                <div className="modal__content">
                    <div className="modal__header">
                        <div
                            id="modal-title"
                            className="modal__title"
                        >
                            {title}
                        </div>
                        <button
                            type="button"
                            className="button modal__close"
                            onClick={handleCancel}
                            aria-label={translator.getMessage('close_button_title')}
                        >
                            <Icon id="#cross" ariaHidden />
                        </button>
                    </div>
                    {subtitle && (
                        <>
                            <span className="visually-hidden">.</span>
                            <div className={subtitleClassName}>
                                {subtitle}
                            </div>
                        </>
                    )}
                    <div className="modal__actions">
                        <button
                            className={okBtnClassName}
                            type="button"
                            onClick={handleConfirm}
                            title={confirmTitle}
                        >
                            {confirmTitle}
                        </button>
                        <button
                            className="button button--l button--transparent modal__btn modal__btn--confirm"
                            type="button"
                            onClick={handleCancel}
                            title={cancelTitle}
                        >
                            {cancelTitle}
                        </button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};
