import React from 'react';
import PropTypes from 'prop-types';
import cn from 'classnames';

import './tooltip.pcss';

export const Tooltip = ({ text, visible }) => {
    return (
        <div className={cn('tooltip', visible ? 'tooltip--on' : 'tooltip--off')}>
            {text}
        </div>
    );
};

Tooltip.propTypes = {
    text: PropTypes.string.isRequired,
    visible: PropTypes.bool,
};

Tooltip.defaultProps = {
    visible: true,
};
