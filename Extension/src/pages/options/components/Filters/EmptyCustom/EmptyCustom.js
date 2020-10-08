import React, { Component } from 'react';
import AddCustomModal from '../AddCustomModal';
import './empty-custom.pcss';

// TODO rewrite to functional component
class EmptyCustom extends Component {
    // eslint-disable-next-line react/state-in-constructor
    state = {
        modalIsOpen: false,
    };

    openModalHandler = () => {
        this.setState({ modalIsOpen: true });
    };

    closeModalHandler = () => {
        this.setState({ modalIsOpen: false });
    };

    render() {
        const { modalIsOpen } = this.state;
        const text = 'Sorry, but you don\'t have any custom filters yet';
        return (
            <div className="empty-custom">
                <div className="empty-custom__ico" />
                <div className="empty-custom__desc">
                    {text}
                </div>
                <button
                    type="button"
                    onClick={this.openModalHandler}
                    className="button button--m button--green"
                >
                    Add custom filter
                </button>
                {modalIsOpen && (
                    <AddCustomModal
                        closeModalHandler={this.closeModalHandler}
                        modalIsOpen={modalIsOpen}
                    />
                )}
            </div>
        );
    }
}

export default EmptyCustom;
