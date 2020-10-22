import React, { useState } from 'react';
import { AddCustomModal } from '../AddCustomModal';
import { reactTranslator } from '../../../../reactCommon/reactTranslator';
import './empty-custom.pcss';

const EmptyCustom = () => {
    const [modalIsOpen, setModalIsOpen] = useState(false);

    const openModalHandler = () => {
        setModalIsOpen(true);
    };

    const closeModalHandler = () => {
        setModalIsOpen(false);
    };

    const text = reactTranslator.translate('options_empty_custom_filter');
    return (
        <div className="empty-custom">
            <div className="empty-custom__ico" />
            <div className="empty-custom__desc">
                {text}
            </div>
            <button
                type="button"
                onClick={openModalHandler}
                className="button button--m button--green"
            >
                {reactTranslator.translate('options_add_custom_filter')}
            </button>
            {modalIsOpen && (
                <AddCustomModal
                    closeModalHandler={closeModalHandler}
                    modalIsOpen={modalIsOpen}
                />
            )}
        </div>
    );
};

export { EmptyCustom };
