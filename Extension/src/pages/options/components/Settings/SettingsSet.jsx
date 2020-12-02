import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

const SettingsSet = (props) => {
    const {
        title, description, children, disabled, inlineControl,
    } = props;
    const settingClassName = classNames({
        setting: true,
        'setting--disabled': disabled,
    });

    return (
        <div className={settingClassName}>
            <div className="setting__container setting__container--vertical">
                <div className="setting__container setting__container--horizontal">
                    <div className="setting__info">
                        <div className="setting__title">{title}</div>
                        {description && <div className="setting__desc">{description}</div>}
                    </div>
                    {inlineControl && <div className="setting__container setting__container--inline setting__inline-control">{inlineControl}</div>}
                </div>
                {children}
            </div>
        </div>
    );
};

SettingsSet.defaultProps = {
    title: '',
    description: '',
    children: null,
    disabled: false,
    inlineControl: null,
};

SettingsSet.propTypes = {
    title: PropTypes.string,
    description: PropTypes.oneOfType([PropTypes.string, PropTypes.element]),
    children: PropTypes.oneOfType([
        PropTypes.element,
        PropTypes.arrayOf(PropTypes.element),
    ]),
    disabled: PropTypes.bool,
    inlineControl: PropTypes.element,
};

export { SettingsSet };
