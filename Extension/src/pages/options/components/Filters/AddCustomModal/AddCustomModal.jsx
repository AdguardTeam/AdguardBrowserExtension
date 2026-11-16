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

import React, {
    useState,
    useContext,
    useEffect,
    useCallback,
    useRef,
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
import { ModalContentWrapper } from '../../../../common/components/ModalContentWrapper/ModalContentWrapper';

import theme from '../../../../common/styles/theme';
import styles from './AddCustomModal.module.pcss';

Modal.setAppElement('#root');

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

    /**
     * Monotonic id of the current modal session. `closeModal()` increments it,
     * so a response of a request that outlived its modal session cannot change
     * the state of the next session.
     */
    const requestIdRef = useRef(0);

    // Invalidate in-flight requests on unmount, so a late response cannot
    // update the state of an unmounted component.
    useEffect(() => () => {
        requestIdRef.current += 1;
    }, []);

    const closeModal = useCallback(() => {
        // Invalidate in-flight requests before the state is reset.
        requestIdRef.current += 1;
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

    /**
     * Checks whether a response still belongs to the current modal session.
     *
     * @param requestId Request id captured before the asynchronous call.
     *
     * @returns `true` if the modal was not closed after the call started.
     */
    const isRequestActual = (requestId) => requestId === requestIdRef.current;

    /**
     * Logs a failure and switches the modal to the error step.
     *
     * The error text is cleared so that `renderErrorStep()` falls back to
     * `options_add_custom_filter_modal_error_subtitle` instead of showing a
     * message left over from a previous attempt.
     *
     * A failure of a request that outlived its modal session is only logged:
     * it must not change the state of the next session.
     *
     * @param reason Failure reason to log.
     * @param requestId Request id captured before the asynchronous call.
     */
    const showErrorStep = (reason, requestId) => {
        logger.error('[ext.AddCustomModal]: error: ', reason);
        if (!isRequestActual(requestId)) {
            return;
        }
        setError('');
        setStepToRender(STEPS.ERROR);
        setLoading(false);
    };

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

        const requestId = requestIdRef.current;
        setStepToRender(STEPS.CHECKING);

        try {
            const result = await messenger.checkCustomUrl(customUrlToAdd);
            if (!isRequestActual(requestId)) {
                return;
            }
            if (result.errorAlreadyExists) {
                setError(translator.getMessage('options_antibanner_custom_filter_already_exists'));
                setStepToRender(STEPS.ERROR);
            } else if (result.errorHtmlContent) {
                setError(translator.getMessage('options_add_custom_filter_modal_error_html_content'));
                setStepToRender(STEPS.ERROR);
            } else {
                setFilterToAdd(result.filter);
                setFilterToAddName(result.filter.name ?? customUrlToAdd);
                setStepToRender(STEPS.APPROVE);
            }
        } catch (e) {
            showErrorStep(e, requestId);
        }
    };

    const renderInputStep = () => (
        <ModalContentWrapper
            closeModalHandler={closeModal}
            title={translator.getMessage('options_add_custom_filter_modal_title')}
            actions={(
                <button
                    className={`button button--l button--green-bg ${theme.modal.btn}`}
                    type="button"
                    onClick={handleSendUrlToCheck}
                    disabled={customUrlToAddIsEmpty}
                >
                    {translator.getMessage('options_popup_next_button')}
                </button>
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
        const requestId = requestIdRef.current;
        setLoading(true);
        try {
            if (!filterToAdd.name) {
                filterToAdd.name = filterToAddName || customUrlToAdd;
            }

            if (!filterToAdd.trusted) {
                filterToAdd.trusted = false;
            }

            const addedFilterId = await settingsStore.addCustomFilter(filterToAdd);
            if (addedFilterId === undefined) {
                // The background page returned no filter data, so the filter
                // was not added.
                showErrorStep('custom filter was not added: no filter data received', requestId);
                return;
            }
        } catch (e) {
            showErrorStep(e, requestId);
            return;
        }

        if (__IS_MV3__) {
            try {
                await settingsStore.checkLimitations();
            } catch (e) {
                // The filter has already been added, so a failure to refresh
                // the rules limits must not be reported as an add failure.
                logger.error('[ext.AddCustomModal]: failed to check limitations: ', e);
            }
        }

        // Do not close a modal that the user reopened while the add was in
        // flight. The filter was added in both cases.
        if (isRequestActual(requestId)) {
            closeModal();
        }
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
                    <button
                        disabled={isLoading || !filterToAddName}
                        type="button"
                        onClick={handleApproveWrapper}
                        className={`button button--l button--green-bg ${theme.modal.btn}`}
                    >
                        {translator.getMessage('options_add_custom_filter_modal_add_button')}
                    </button>
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

                    <div className={styles.filterInfo}>
                        {trimmedDescription && (
                            <div>
                                <span className={styles.filterInfoItem}>
                                    {translator.getMessage('options_popup_filter_description')}
                                </span>
                                <span className={styles.filterInfoItem}>
                                    {trimmedDescription}
                                </span>
                            </div>
                        )}
                        {trimmedVersion && (
                            <div>
                                <span className={styles.filterInfoItem}>
                                    {translator.getMessage('options_popup_filter_version')}
                                </span>
                                <span className={styles.filterInfoItem}>
                                    {trimmedVersion}
                                </span>
                            </div>
                        )}
                        <div>
                            <span className={styles.filterInfoItem}>
                                {translator.getMessage('options_popup_filter_rules_count')}
                            </span>
                            <span className={styles.filterInfoItem}>
                                {rulesCount}
                            </span>
                        </div>
                        {trimmedHomepage && (
                            <div>
                                <span className={styles.filterInfoItem}>
                                    {translator.getMessage('options_popup_filter_homepage')}
                                </span>
                                <a
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    href={trimmedHomepage}
                                    className={`${styles.filterInfoItem} ${styles.filterInfoItemUrl}`}
                                >
                                    {trimmedHomepage}
                                </a>
                            </div>
                        )}
                        <div>
                            <span className={styles.filterInfoItem}>
                                {translator.getMessage('options_popup_filter_url')}
                            </span>
                            <a
                                target="_blank"
                                rel="noopener noreferrer"
                                href={customUrl}
                                className={`${styles.filterInfoItem} ${styles.filterInfoItemUrl}`}
                            >
                                {customUrl}
                            </a>
                        </div>
                    </div>

                    <div className={styles.filterTrusted}>
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
                        <div className={styles.filterTrustedDesc}>
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
                <form className={theme.modal.content} />
            </ModalContentWrapper>
        );
    };

    const tryAgainHandler = () => {
        setStepToRender(STEPS.INPUT);
        setError('');
        setLoading(false);
    };

    const renderErrorStep = () => {
        return (
            <ModalContentWrapper
                closeModalHandler={closeModal}
                title={translator.getMessage('options_add_custom_filter_modal_error_title')}
                actions={(
                    <button
                        type="button"
                        onClick={tryAgainHandler}
                        className={`button button--l button--green-bg ${theme.modal.btn}`}
                    >
                        {translator.getMessage('options_popup_try_again_button')}
                    </button>
                )}
            >
                <form>
                    <div role="alert" className={styles.desc}>
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
            onRequestClose={closeModal}
            overlayClassName={theme.modal.overlay}
            className={theme.modal.wrapper}
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
