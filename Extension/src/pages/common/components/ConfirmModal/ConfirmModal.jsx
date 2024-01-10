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

export const ConfirmModal = ({
    title,
    subtitle,
    isOpen,
    onConfirm,
    onCancel,
    setIsOpen,
    customCancelTitle,
    customConfirmTitle,
    isConsent,
}) => {
    const confirmTitle = customConfirmTitle || 'OK';
    const cancelTitle = customCancelTitle || translator.getMessage('options_confirm_modal_cancel_button');

    const subtitleClassName = cn('modal__subtitle', {
        'modal__subtitle--short': !isConsent,
    });

    const okBtnClassName = cn('button button--m modal__btn button--green', {
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
        onCancel();
    };

    return (
        <>
            <Modal
                isOpen={isOpen}
                onRequestClose={handleCancel}
                // reset default padding
                style={{ content: { padding: 0 } }}
            >
                <div className="modal">
                    <div className="modal__header">
                        <button
                            type="button"
                            className="button modal__close"
                            aria-label={translator.getMessage('close_button_title')}
                            onClick={handleCancel}
                        >
                            <Icon id="#cross" />
                        </button>
                    </div>
                    <div className="modal__title">
                        {title}
                    </div>
                    {subtitle && (
                        <div className={subtitleClassName}>
                            {subtitle}
                        </div>
                    )}
                    <div className="modal__actions">
                        <button
                            className={okBtnClassName}
                            type="button"
                            onClick={handleConfirm}
                        >
                            {confirmTitle}
                        </button>
                        <button
                            className="button button--m button--transparent modal__btn modal__btn--confirm"
                            type="button"
                            onClick={handleCancel}
                        >
                            {cancelTitle}
                        </button>
                    </div>
                </div>
            </Modal>
        </>
    );
};
