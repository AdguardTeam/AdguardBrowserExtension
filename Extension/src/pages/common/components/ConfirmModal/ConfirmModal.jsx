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
                    <div className="modal__subtitle">
                        {subtitle}
                    </div>
                )}
                <div className="modal__content">
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
