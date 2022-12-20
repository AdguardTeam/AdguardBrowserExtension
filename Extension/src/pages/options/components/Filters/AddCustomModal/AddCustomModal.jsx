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

/* eslint-disable jsx-a11y/no-autofocus */
import React, { useState, useContext } from 'react';
import PropTypes from 'prop-types';
import Modal from 'react-modal';

import { messenger } from '../../../../services/messenger';
import { reactTranslator } from '../../../../../common/translators/reactTranslator';
import { Log } from '../../../../../common/log';
import { ModalContentWrapper } from './ModalContentWrapper';
import { rootStore } from '../../../stores/RootStore';
import { Icon } from '../../../../common/components/ui/Icon';

Modal.setAppElement('#root');

const customStyles = {
    overlay: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, .1)',
        width: '100%',
        height: '100%',
        zIndex: 7,
    },
    content: {
        border: 0,
        width: '560px',
        height: 'auto',
        position: 'relative',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        padding: '30px',
        overflow: 'auto',
    },
};

const AddCustomModal = ({
    closeModalHandler,
    modalIsOpen,
    initialUrl,
    initialTitle,
}) => {
    const STEPS = {
        INPUT: 'input',
        CHECKING: 'checking',
        APPROVE: 'approve',
        ERROR: 'error',
    };

    const [customUrlToAdd, setCustomUrlToAdd] = useState(initialUrl);
    const [stepToRender, setStepToRender] = useState(STEPS.INPUT);
    const [error, setError] = useState(reactTranslator.getMessage('options_popup_check_false_description'));
    const [filterToAdd, setFilterToAdd] = useState(null);
    const [filterToAddName, setFilterToAddName] = useState(initialTitle);

    const closeModal = () => {
        closeModalHandler();
        setCustomUrlToAdd('');
        setStepToRender(STEPS.INPUT);
        setError('');
        setFilterToAdd(null);
        setFilterToAddName(initialTitle);
    };

    const { settingsStore } = useContext(rootStore);

    const handleInputChange = (e) => {
        const { value } = e.target;
        setCustomUrlToAdd(value);
    };

    const handleChangeFilterName = (e) => {
        const { value } = e.target;
        setFilterToAddName(value);
        filterToAdd.name = value;
    };

    const handleSendUrlToCheck = async () => {
        setStepToRender(STEPS.CHECKING);

        try {
            const result = await messenger.checkCustomUrl(customUrlToAdd);
            if (result.error) {
                setError(result.error);
                setStepToRender(STEPS.ERROR);
            } else if (!result.filter) {
                setStepToRender(STEPS.ERROR);
            } else {
                setFilterToAdd(result.filter);
                setStepToRender(STEPS.APPROVE);
            }
        } catch (e) {
            Log.error(e);
            setStepToRender(STEPS.ERROR);
        }
    };

    const renderInputStep = () => (
        <ModalContentWrapper
            closeModalHandler={closeModal}
            title={reactTranslator.getMessage('options_popup_url_title')}
        >
            <form className="modal__content" onSubmit={handleSendUrlToCheck}>
                <input
                    autoFocus
                    type="text"
                    placeholder={reactTranslator.getMessage('options_popup_url_placeholder')}
                    onChange={handleInputChange}
                    className="modal__input"
                    value={customUrlToAdd}
                />
                <div className="modal__desc">
                    {reactTranslator.getMessage('options_popup_call_to_action')}
                </div>
                <div className="modal__desc">
                    {reactTranslator.getMessage('options_popup_description')}
                </div>
            </form>
            <button
                className="button button--m button--green modal__btn"
                type="button"
                onClick={handleSendUrlToCheck}
            >
                {reactTranslator.getMessage('options_popup_next_button')}
            </button>
        </ModalContentWrapper>
    );

    const handleTrustedCheckbox = (event) => {
        filterToAdd.trusted = !!event.target.checked;
    };

    const handleApprove = async () => {
        try {
            if (!filterToAdd.name) {
                filterToAdd.name = filterToAddName || customUrlToAdd;
            }
            await settingsStore.addCustomFilter(filterToAdd);
        } catch (e) {
            setStepToRender(STEPS.ERROR);
            Log.error(e);
        }
        closeModal();
    };

    const renderApproveStep = () => {
        const {
            name, description, version, rulesCount, homepage, customUrl,
        } = filterToAdd;

        return (
            <ModalContentWrapper
                closeModalHandler={closeModal}
                title="New filter subscription"
            >
                <form className="modal__content" onSubmit={handleApprove}>
                    <div className="modal__row">
                        <div className="modal__cell modal__cell--title">{reactTranslator.getMessage('options_popup_filter_title')}</div>
                        <input
                            className="modal__input"
                            type="text"
                            placeholder={reactTranslator.getMessage('options_popup_title_placeholder')}
                            onChange={handleChangeFilterName}
                            defaultValue={name || filterToAddName || customUrlToAdd}
                        />
                    </div>
                    <div className="modal__row">
                        <div className="modal__cell">{reactTranslator.getMessage('options_popup_filter_description')}</div>
                        <div className="modal__cell">{description}</div>
                    </div>
                    <div className="modal__row">
                        <div className="modal__cell">{reactTranslator.getMessage('options_popup_filter_version')}</div>
                        <div className="modal__cell">{version}</div>
                    </div>
                    <div className="modal__row">
                        <div className="modal__cell">{reactTranslator.getMessage('options_popup_filter_rules_count')}</div>
                        <div className="modal__cell">{rulesCount}</div>
                    </div>
                    <div className="modal__row">
                        <div className="modal__cell">{reactTranslator.getMessage('options_popup_filter_homepage')}</div>
                        <div className="modal__cell modal__cell--url">{homepage}</div>
                    </div>
                    <div className="modal__row">
                        <div className="modal__cell">{reactTranslator.getMessage('options_popup_filter_url')}</div>
                        <div className="modal__cell modal__cell--url">{customUrl}</div>
                    </div>
                    <div className="modal__row">
                        <label className="checkbox-label" htmlFor="trusted">
                            <input
                                id="trusted"
                                type="checkbox"
                                onChange={handleTrustedCheckbox}
                            />
                            <div className="custom-checkbox">
                                <Icon id="#checked" classname="icon--checked" />
                            </div>
                            {reactTranslator.getMessage('options_popup_trusted_filter_title')}
                        </label>
                    </div>
                </form>
                <div className="modal__row modal__row--info">
                    {reactTranslator.getMessage('options_popup_trusted_filter_description')}
                </div>
                <button
                    type="button"
                    onClick={handleApprove}
                    className="button button--m button--green modal__btn"
                >
                    {reactTranslator.getMessage('options_popup_subscribe_button')}
                </button>
            </ModalContentWrapper>
        );
    };

    const renderCheckingStep = () => {
        return (
            <>
                <ModalContentWrapper closeModalHandler={closeModal}>
                    <form className="modal__content modal__content--center-text">
                        <div className="modal__desc">
                            {reactTranslator.getMessage('options_popup_checking_filter')}
                        </div>
                    </form>
                </ModalContentWrapper>
            </>
        );
    };

    const tryAgainHandler = () => {
        setStepToRender(STEPS.INPUT);
        setError('');
    };

    const renderErrorStep = () => {
        return (
            <>
                <ModalContentWrapper closeModalHandler={closeModal}>
                    <form className="modal__content modal__content--center-text">
                        <div className="modal__subtitle">
                            {reactTranslator.getMessage('options_popup_check_false_title')}
                        </div>
                        <div className="modal__desc">
                            {error || reactTranslator.getMessage('options_popup_check_false_description')}
                        </div>
                    </form>
                    <button
                        type="button"
                        onClick={tryAgainHandler}
                        className="button button--m button--transparent modal__btn"
                    >
                        {reactTranslator.getMessage('options_popup_try_again_button')}
                    </button>
                </ModalContentWrapper>
            </>
        );
    };

    const renderStep = () => {
        switch (stepToRender) {
            case STEPS.INPUT: {
                return renderInputStep();
            }
            case STEPS.CHECKING: {
                return renderCheckingStep();
            }
            case STEPS.ERROR: {
                return renderErrorStep();
            }
            case STEPS.APPROVE: {
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
            onRequestClose={closeModal}
        >
            {renderStep()}
        </Modal>
    );
};

AddCustomModal.propTypes = {
    closeModalHandler: PropTypes.func.isRequired,
    modalIsOpen: PropTypes.bool.isRequired,
};

export { AddCustomModal };
