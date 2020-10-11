import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

const SettingsSet = (props) => {
    const {
        title, description, children, disabled,
    } = props;
    const settingClassName = classNames({
        setting: true,
        'setting--disabled': disabled,
    });
    return (
        <div className={settingClassName}>
            <div className="setting__info">
                <div className="setting__title">
                    {title}
                </div>
                { description
                        && (
                            <div className="setting__desc">
                                {description}
                            </div>
                        )}
                {children}
            </div>
        </div>
    );
};

SettingsSet.defaultProps = {
    description: '',
    title: '',
    disabled: false,
};

SettingsSet.propTypes = {
    title: PropTypes.string,
    description: PropTypes.oneOfType([PropTypes.string, PropTypes.element]),
    children: PropTypes.oneOfType([
        PropTypes.element,
        PropTypes.arrayOf(PropTypes.element),
    ]).isRequired,
    disabled: PropTypes.bool,
};

export default SettingsSet;
