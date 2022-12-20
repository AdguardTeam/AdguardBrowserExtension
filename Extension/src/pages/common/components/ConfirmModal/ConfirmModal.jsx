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

export const ConfirmModal = ({
    title,
    subtitle,
    isOpen,
    onConfirm,
    setIsOpen,
    customCancelTitle,
    customConfirmTitle,
}) => {
    const confirmTitle = customConfirmTitle || 'OK';
    const cancelTitle = customCancelTitle || 'Cancel';

    const closeModal = () => {
        setIsOpen(false);
    };

    const handleConfirm = () => {
        closeModal();
        onConfirm();
    };

    return (
        <>
            <Modal
                isOpen={isOpen}
                onRequestClose={closeModal}
            >
                <div className="modal__title">
                    {title}
                </div>
                {subtitle && (
                    <div className="modal__subtitle modal__subtitle--confirm">
                        {subtitle}
                    </div>
                )}
                <div className="modal__content modal__content--button">
                    <button
                        className="button button--m button--red-bg modal__btn modal__btn--statistic"
                        type="button"
                        onClick={handleConfirm}
                    >
                        {confirmTitle}
                    </button>
                    <button
                        className="button button--m button--transparent modal__btn modal__btn--statistic"
                        type="button"
                        onClick={closeModal}
                    >
                        {cancelTitle}
                    </button>
                </div>
            </Modal>
        </>
    );
};
