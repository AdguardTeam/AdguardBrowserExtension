import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

function SettingsSection(props) {
    const { title, children, disabled } = props;
    const settingGroupClassName = classNames({
        settings__group: true,
        'settings__group--disabled': disabled,
    });
    return (
        <div key={title}>
            <div
                className={settingGroupClassName}
            >
                {title && <h3 className="subtitle">{title}</h3>}
                {children}
            </div>
        </div>
    );
}

SettingsSection.defaultProps = {
    title: '',
    disabled: false,
};

SettingsSection.propTypes = {
    title: PropTypes.string,
    children: PropTypes.oneOfType([
        PropTypes.object,
        PropTypes.arrayOf(PropTypes.node),
    ]).isRequired,
    disabled: PropTypes.bool,
};

export default SettingsSection;
