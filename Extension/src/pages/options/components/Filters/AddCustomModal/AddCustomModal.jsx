import React, { useState, useContext } from 'react';
import PropTypes from 'prop-types';
import Modal from 'react-modal';
import messenger from '../../../../services/messenger';
import { log } from '../../../../../background/utils/log';
import i18n from '../../../../services/i18n';
import ModalContentWrapper from '../ModalContentWrapper';
import rootStore from '../../../stores';

Modal.setAppElement('#root');

const customStyles = {
    overlay: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, .1)',
        width: '100%',
        height: '100%',
    },
    content: {
        border: 0,
        width: '560px',
        height: 'auto',
        position: 'relative',
        padding: '30px',
        overflow: 'auto',
    },
};

const AddCustomModal = ({ closeModalHandler, modalIsOpen }) => {
    const [customUrlToAdd, setCustomUrlToAdd] = useState('');
    const [stepToRender, setStepToRender] = useState('input');
    const [filterToAdd, setFilterToAdd] = useState({});

    const { settingsStore } = useContext(rootStore);

    const handleInputChange = (e) => {
        const { value } = e.target;
        setCustomUrlToAdd(value);
    };

    const handleSendUrlToCheck = async () => {
        setStepToRender('checking');
        let result;
        try {
            result = await messenger.checkCustomUrl(customUrlToAdd);
            setFilterToAdd(result);
            setStepToRender('approve');
        } catch (e) {
            log.error(e);
            setStepToRender('error');
        }
    };

    const renderInputStep = () => {
        // TODO [maximtop] add enter key press handler
        return (
            <>
                <ModalContentWrapper
                    closeModalHandler={closeModalHandler}
                    title="New filter subscription"
                >
                    <div className="modal__content">
                        <input
                            type="text"
                            placeholder="Enter URL or path"
                            onChange={handleInputChange}
                            className="modal__input"
                            value={customUrlToAdd}
                        />
                        <div className="modal__desc">
                            Enter valid URL or file path of the filter into field above.
                        </div>
                        <div className="modal__desc">
                            You will be subscribed to that filter.
                        </div>
                    </div>
                    <button
                        className="button button--m button--green modal__btn"
                        type="button"
                        onClick={handleSendUrlToCheck}
                    >
                        Next
                    </button>
                </ModalContentWrapper>
            </>
        );
    };

    const handleApprove = async () => {
        try {
            await settingsStore.addCustomFilter(filterToAdd);
        } catch (e) {
            log.error(e);
        }
        closeModalHandler();
    };

    const renderApproveStep = () => {
        const {
            name, description, version, rulesCount, homepage, customUrl,
        } = filterToAdd.filter;

        // TODO [maximtop] next line is used quite often, needs DRY refactoring
        return (
            <>
                <ModalContentWrapper
                    closeModalHandler={closeModalHandler}
                    title="New filter subscription"
                >
                    <div className="modal__content">
                        <div className="modal__row">
                            <div className="modal__cell">Title:</div>
                            <input
                                className="modal__input"
                                type="text"
                                // TODO add handler
                                value={name}
                            />
                        </div>
                        <div className="modal__row">
                            <div className="modal__cell">Description:</div>
                            <div className="modal__cell">{description}</div>
                        </div>
                        <div className="modal__row">
                            <div className="modal__cell">Version:</div>
                            <div className="modal__cell">{version}</div>
                        </div>
                        <div className="modal__row">
                            <div className="modal__cell">Rules count:</div>
                            <div className="modal__cell">{rulesCount}</div>
                        </div>
                        <div className="modal__row">
                            <div className="modal__cell">Homepage:</div>
                            <div className="modal__cell modal__cell--url">{homepage}</div>
                        </div>
                        <div className="modal__row">
                            <div className="modal__cell">URL:</div>
                            <div className="modal__cell modal__cell--url">{customUrl}</div>
                        </div>
                        <div className="modal__row">
                            <input
                                className="modal__checkbox"
                                id="trusted"
                                type="checkbox"
                            />
                            <label
                                className="modal__checkbox-label"
                                htmlFor="trusted"
                            >
                                Trusted
                            </label>
                        </div>
                    </div>
                    <div className="modal__row modal__row--info">
                        {i18n.translate('options_popup_trusted_filter_description')}
                    </div>
                    <button
                        type="button"
                        onClick={handleApprove}
                        className="button button--m button--green modal__btn"
                    >
                        Subscribe
                    </button>
                </ModalContentWrapper>
            </>
        );
    };

    const renderCheckingStep = () => {
        // TODO: add localization
        return (
            <>
                <ModalContentWrapper closeModalHandler={closeModalHandler}>
                    <div className="modal__content modal__content--center-text">
                        <div className="modal__desc">
                            We are checking your url
                        </div>
                    </div>
                </ModalContentWrapper>
            </>
        );
    };

    const tryAgainHandler = () => {
        setStepToRender('first');
    };

    // TODO [maximtop] here we can show detailed error message than in the current version
    const renderErrorStep = () => {
        // TODO add localization
        return (
            <>
                <ModalContentWrapper closeModalHandler={closeModalHandler}>
                    <div className="modal__content modal__content--center-text">
                        <div className="modal__subtitle">
                            Error
                        </div>
                        <div className="modal__desc">
                            Error while adding your custom filter
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={tryAgainHandler}
                        className="button button--m button--transparent modal__btn"
                    >
                        Try again
                    </button>
                </ModalContentWrapper>
            </>
        );
    };

    const renderStep = () => {
        switch (stepToRender) {
        case 'input': {
            return renderInputStep();
        }
        case 'checking': {
            return renderCheckingStep();
        }
        case 'error': {
            return renderErrorStep();
        }
        case 'approve': {
            return renderApproveStep();
        }
        default:
            throw new Error(`there is no such step: ${stepToRender}`);
        }
    };

    return (
        <Modal
            isOpen={modalIsOpen}
            style={customStyles}
        >
            {renderStep()}
        </Modal>
    );
};

AddCustomModal.propTypes = {
    closeModalHandler: PropTypes.func.isRequired,
    modalIsOpen: PropTypes.bool.isRequired,
};

export default AddCustomModal;
