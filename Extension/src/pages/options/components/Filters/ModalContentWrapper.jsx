import React from 'react';
import PropTypes from 'prop-types';

const ModalContentWrapper = ({ closeModalHandler, children, title }) => {
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
};

ModalContentWrapper.defaultProps = {
    title: '',
};

ModalContentWrapper.propTypes = {
    closeModalHandler: PropTypes.func.isRequired,
    children: PropTypes.arrayOf(PropTypes.object).isRequired,
    title: PropTypes.string,
};

export default ModalContentWrapper;
