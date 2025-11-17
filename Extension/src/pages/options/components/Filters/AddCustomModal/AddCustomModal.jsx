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

import React, {
    useState,
    useContext,
    useEffect,
    useCallback,
} from 'react';
import Modal from 'react-modal';
import { observer } from 'mobx-react';

import PropTypes from 'prop-types';

import { messenger } from '../../../../services/messenger';
import { translator } from '../../../../../common/translators/translator';
import { logger } from '../../../../../common/logger';
import { rootStore } from '../../../stores/RootStore';
import { addMinDelayLoader } from '../../../../common/components/helpers';
import { Icon } from '../../../../common/components/ui/Icon';
import { AddCustomInput } from '../AddCustomInput';

import { ModalContentWrapper } from './ModalContentWrapper';

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
        height: 'auto',
        position: 'relative',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        padding: 0,
        overflow: 'auto',
        borderRadius: 8,
    },
};

/**
 * Escape key string.
 */
const ESCAPE_KEY = 'Escape';

/**
 * Modal steps.
 */
const STEPS = {
    INPUT: 'input',
    CHECKING: 'checking',
    APPROVE: 'approve',
    ERROR: 'error',
};

const AddCustomModal = observer(({
    closeModalHandler,
    modalIsOpen,
    initialUrl,
    initialTitle,
}) => {
    const [isLoading, setLoading] = useState(false);
    const [customUrlToAdd, setCustomUrlToAdd] = useState(initialUrl);
    const [stepToRender, setStepToRender] = useState(STEPS.INPUT);
    const [error, setError] = useState(translator.getMessage('options_add_custom_filter_modal_error_subtitle'));
    const [filterToAdd, setFilterToAdd] = useState(null);
    const [filterToAddName, setFilterToAddName] = useState(initialTitle);
    const customUrlToAddIsEmpty = customUrlToAdd.trim() === '';

    const closeModal = useCallback(() => {
        closeModalHandler();
        setLoading(false);
        setCustomUrlToAdd('');
        setStepToRender(STEPS.INPUT);
        setError('');
        setFilterToAdd(null);
        setFilterToAddName(initialTitle);
    }, [closeModalHandler, initialTitle]);

    /**
     * Listen for keydown events globally, because `react-modal` package when
     * content of modal gets re-rendered, it loses focus from current interactive
     * element and ability to close with ESC key is lost. Probably it's intended
     * behavior of the package, but it's not desired in our case. They attach
     * keydown event listener to modal container itself.
     */
    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === ESCAPE_KEY) {
                closeModal();
            }
        };

        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [closeModal]);

    const { settingsStore, uiStore } = useContext(rootStore);

    const handleChangeFilterName = (value) => {
        setFilterToAddName(value);
        filterToAdd.name = value;
    };

    const handleSendUrlToCheck = async (e) => {
        // If the input is empty, we do not send the form to prevent
        // an error when loading HTML code instead of filter rules due
        // to incorrect url
        if (customUrlToAddIsEmpty) {
            e.preventDefault();
            return;
        }

        setStepToRender(STEPS.CHECKING);

        try {
            const result = await messenger.checkCustomUrl(customUrlToAdd);
            if (result === null) {
                setStepToRender(STEPS.ERROR);
            } else if (result.errorAlreadyExists) {
                setError(translator.getMessage('options_antibanner_custom_filter_already_exists'));
                setStepToRender(STEPS.ERROR);
            } else if (!result.filter) {
                setStepToRender(STEPS.ERROR);
            } else {
                setFilterToAdd(result.filter);
                setFilterToAddName(result.filter.name ?? customUrlToAdd);
                setStepToRender(STEPS.APPROVE);
            }
        } catch (e) {
            logger.error('[ext.AddCustomModal]: error: ', e);
            setStepToRender(STEPS.ERROR);
        }
    };

    const renderInputStep = () => (
        <ModalContentWrapper
            closeModalHandler={closeModal}
            title={translator.getMessage('options_add_custom_filter_modal_title')}
            actions={(
                <div className="modal__actions">
                    <button
                        className="button button--l button--green-bg modal__btn"
                        type="button"
                        onClick={handleSendUrlToCheck}
                        disabled={customUrlToAddIsEmpty}
                    >
                        {translator.getMessage('options_popup_next_button')}
                    </button>
                </div>
            )}
        >
            <form onSubmit={handleSendUrlToCheck}>
                <AddCustomInput
                    autoFocus
                    placeholder={translator.getMessage('options_popup_url_placeholder')}
                    onChange={setCustomUrlToAdd}
                    value={customUrlToAdd}
                />
            </form>
        </ModalContentWrapper>
    );

    const handleTrustedCheckbox = (event) => {
        filterToAdd.trusted = !!event.target.checked;
    };

    const handleApprove = async () => {
        setLoading(true);
        try {
            if (!filterToAdd.name) {
                filterToAdd.name = filterToAddName || customUrlToAdd;
            }

            if (!filterToAdd.trusted) {
                filterToAdd.trusted = false;
            }

            await settingsStore.addCustomFilter(filterToAdd);
            if (__IS_MV3__) {
                await settingsStore.checkLimitations();
            }
        } catch (e) {
            setStepToRender(STEPS.ERROR);
            logger.error('[ext.AddCustomModal]: error: ', e);
        }
        closeModal();
    };

    const handleApproveWrapper = addMinDelayLoader(
        uiStore.setShowLoader,
        handleApprove,
    );

    const renderApproveStep = () => {
        const {
            description,
            version,
            rulesCount,
            homepage,
            customUrl,
        } = filterToAdd;

        const trimmedDescription = description?.trim();
        const trimmedVersion = version?.trim();
        const trimmedHomepage = homepage?.trim();

        return (
            <ModalContentWrapper
                closeModalHandler={closeModal}
                // TODO: new base strings keys are added and some of them may be duplicates
                // but we need all of them until v5.0 is merged into the master branch
                // so base strings should be checked after that
                title={translator.getMessage('options_add_custom_filter_modal_title')}
                actions={(
                    <div className="modal__actions">
                        <button
                            disabled={isLoading || !filterToAddName}
                            type="button"
                            onClick={handleApproveWrapper}
                            className="button button--l button--green-bg modal__btn"
                        >
                            {translator.getMessage('options_add_custom_filter_modal_add_button')}
                        </button>
                    </div>
                )}
            >
                <form onSubmit={handleApproveWrapper}>
                    <AddCustomInput
                        label={translator.getMessage('options_add_custom_filter_modal_filter_name')}
                        disabled={isLoading}
                        placeholder={translator.getMessage('options_popup_title_placeholder')}
                        onChange={handleChangeFilterName}
                        value={filterToAddName}
                    />

                    <div className="modal__filter--info">
                        {trimmedDescription && (
                            <div>
                                <span className="modal__filter--info-item">
                                    {translator.getMessage('options_popup_filter_description')}
                                </span>
                                <span className="modal__filter--info-item">
                                    {trimmedDescription}
                                </span>
                            </div>
                        )}
                        {trimmedVersion && (
                            <div>
                                <span className="modal__filter--info-item">
                                    {translator.getMessage('options_popup_filter_version')}
                                </span>
                                <span className="modal__filter--info-item">
                                    {trimmedVersion}
                                </span>
                            </div>
                        )}
                        <div>
                            <span className="modal__filter--info-item">
                                {translator.getMessage('options_popup_filter_rules_count')}
                            </span>
                            <span className="modal__filter--info-item">
                                {rulesCount}
                            </span>
                        </div>
                        {trimmedHomepage && (
                            <div>
                                <span className="modal__filter--info-item">
                                    {translator.getMessage('options_popup_filter_homepage')}
                                </span>
                                <a
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    href={trimmedHomepage}
                                    className="modal__filter--info-item modal__filter--info-item--url"
                                >
                                    {trimmedHomepage}
                                </a>
                            </div>
                        )}
                        <div>
                            <span className="modal__filter--info-item">
                                {translator.getMessage('options_popup_filter_url')}
                            </span>
                            <a
                                target="_blank"
                                rel="noopener noreferrer"
                                href={customUrl}
                                className="modal__filter--info-item modal__filter--info-item--url"
                            >
                                {customUrl}
                            </a>
                        </div>
                    </div>

                    <div className="modal__filter--trusted">
                        <label className="checkbox-label" htmlFor="trusted">
                            <input
                                id="trusted"
                                type="checkbox"
                                className="sr-only"
                                disabled={isLoading}
                                onChange={handleTrustedCheckbox}
                            />
                            <div className="custom-checkbox">
                                <Icon
                                    id="#checked"
                                    className="icon--18"
                                    aria-hidden="true"
                                />
                            </div>
                            {translator.getMessage('options_add_custom_filter_modal_filter_trusted')}
                        </label>
                        <div className="modal__filter--trusted-desc">
                            {translator.getMessage('options_add_custom_filter_modal_filter_trusted_description')}
                        </div>
                    </div>
                </form>
            </ModalContentWrapper>
        );
    };

    const renderCheckingStep = () => {
        return (
            <ModalContentWrapper
                closeModalHandler={closeModal}
                title={translator.getMessage('options_add_custom_filter_modal_checking_filter')}
            >
                <form className="modal__content" />
            </ModalContentWrapper>
        );
    };

    const tryAgainHandler = () => {
        setStepToRender(STEPS.INPUT);
        setError('');
    };

    const renderErrorStep = () => {
        return (
            <ModalContentWrapper
                closeModalHandler={closeModal}
                title={translator.getMessage('options_add_custom_filter_modal_error_title')}
                actions={(
                    <div className="modal__actions">
                        <button
                            type="button"
                            onClick={tryAgainHandler}
                            className="button button--l button--green-bg modal__btn"
                        >
                            {translator.getMessage('options_popup_try_again_button')}
                        </button>
                    </div>
                )}
            >
                <form>
                    <div role="alert" className="modal__desc">
                        {error || translator.getMessage('options_add_custom_filter_modal_error_subtitle')}
                    </div>
                </form>
            </ModalContentWrapper>
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
});

AddCustomModal.propTypes = {
    closeModalHandler: PropTypes.func.isRequired,
    modalIsOpen: PropTypes.bool.isRequired,
};

export { AddCustomModal };
