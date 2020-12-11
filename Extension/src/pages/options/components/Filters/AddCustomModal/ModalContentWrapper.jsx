import React from 'react';
import PropTypes from 'prop-types';
import { Icon } from '../../../../common/components/ui/Icon';

const ModalContentWrapper = ({ closeModalHandler, children, title }) => {
    return (
        <div className="modal">
            <button
                type="button"
                className="button"
                onClick={closeModalHandler}
            >
                <Icon id="#cross" classname="modal__close" />
            </button>
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
    children: PropTypes.oneOfType([PropTypes.array, PropTypes.object]).isRequired,
    title: PropTypes.string,
};

export { ModalContentWrapper };
