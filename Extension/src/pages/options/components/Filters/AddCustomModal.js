import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Modal from 'react-modal';
import messenger from '../../../services/messenger';
import { log } from '../../../../background/utils/log';
import i18n from '../../../services/i18n';

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

// TODO [maximtop] consider move this component in the separate file
function ModalContentWrapper(props) {
    const { closeModalHandler, children, title } = props;
    return (
        <div className="modal">
            <button
                type="button"
                className="button modal__close"
                onClick={closeModalHandler}
            />
            <div className="modal__title">
                {title}
            </div>
            {children}
        </div>
    );
}

ModalContentWrapper.propTypes = {
    closeModalHandler: PropTypes.func.isRequired,
    children: PropTypes.arrayOf(PropTypes.node).isRequired,
    title: PropTypes.string.isRequired,
};

const defaultState = {
    customUrlToAdd: '',
    stepToRender: 'input',
    filterToAdd: {},
};

// TODO rewrite to functional component
class AddCustomModal extends Component {
    // eslint-disable-next-line react/state-in-constructor
    state = {
        ...defaultState,
    };

    handleInputChange = (e) => {
        const { value } = e.target;
        this.setState({ customUrlToAdd: value });
    };

    handleSendUrlToCheck = async () => {
        const { customUrlToAdd } = this.state;
        this.setState({ stepToRender: 'checking' });
        let result;
        try {
            result = await messenger.checkCustomUrl(customUrlToAdd);
        } catch (e) {
            log.error(e);
            this.setState({ stepToRender: 'error' });
        }
        this.setState({
            filterToAdd: result,
            stepToRender: 'approve',
        });
    };

    renderInputStep = () => {
        const { closeModalHandler } = this.props;
        const { customUrlToAdd } = this.state;
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
                            onChange={this.handleInputChange}
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
                        onClick={this.handleSendUrlToCheck}
                    >
                        Next
                    </button>
                </ModalContentWrapper>
            </>
        );
    };

    handleApprove = () => {
        this.setState(async (state, props) => {
            const { filterToAdd } = state;
            const { closeModalHandler } = props;
            if (!filterToAdd) {
                return null;
            }
            try {
                await messenger.addCustomFilter(filterToAdd);
            } catch (e) {
                log.error(e);
            }
            closeModalHandler();
            return {
                ...state,
                ...defaultState,
            };
        });
    };

    renderApproveStep = () => {
        const {
            filterToAdd: {
                title, description, version, ruleCount, homepage, url,
            },
        } = this.state;
        // TODO [maximtop] next line is used quite often, needs DRY refactoring
        const { closeModalHandler } = this.props;
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
                                value={title}
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
                            <div className="modal__cell">{ruleCount}</div>
                        </div>
                        <div className="modal__row">
                            <div className="modal__cell">Homepage:</div>
                            <div className="modal__cell modal__cell--url">{homepage}</div>
                        </div>
                        <div className="modal__row">
                            <div className="modal__cell">URL:</div>
                            <div className="modal__cell modal__cell--url">{url}</div>
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
                        onClick={this.handleApprove}
                        className="button button--m button--green modal__btn"
                    >
                        Subscribe
                    </button>
                </ModalContentWrapper>
            </>
        );
    };

    renderCheckingStep = () => {
        const { closeModalHandler } = this.props;
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

    tryAgainHandler = () => {
        this.setState({ stepToRender: 'first' });
    };

    // TODO [maximtop] here we can show detailed error message than in the current version
    renderErrorStep = () => {
        const { closeModalHandler } = this.props;
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
                        onClick={this.tryAgainHandler}
                        className="button button--m button--transparent modal__btn"
                    >
                        Try again
                    </button>
                </ModalContentWrapper>
            </>
        );
    };

    renderStep = () => {
        const { stepToRender } = this.state;
        switch (stepToRender) {
        case 'input': {
            return this.renderInputStep();
        }
        case 'checking': {
            return this.renderCheckingStep();
        }
        case 'error': {
            return this.renderErrorStep();
        }
        case 'approve': {
            return this.renderApproveStep();
        }
        default:
            throw new Error(`there is no such step: ${stepToRender}`);
        }
    };

    render() {
        const { modalIsOpen } = this.props;
        return (
            <Modal
                isOpen={modalIsOpen}
                style={customStyles}
            >
                {this.renderStep(this.state, this.props)}
            </Modal>
        );
    }
}

AddCustomModal.propTypes = {
    closeModalHandler: PropTypes.func.isRequired,
    modalIsOpen: PropTypes.bool.isRequired,
};

export default AddCustomModal;
