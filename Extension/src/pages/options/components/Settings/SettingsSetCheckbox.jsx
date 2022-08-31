import React from 'react';
import PropTypes from 'prop-types';
import { Setting, SETTINGS_TYPES } from './Setting';
import { SettingsSet } from './SettingsSet';

// clickable setting with a label wrap
const SettingsSetCheckbox = (props) => {
    const {
        title, description, children, disabled,
        id, handler, label, inverted, value, sectionDisabled,
    } = props;

    return (
        <label
            htmlFor={id}
            className="setting-checkbox"
        >
            <SettingsSet
                title={title}
                description={description}
                disabled={disabled}
                inlineControl={(
                    <Setting
                        id={id}
                        type={SETTINGS_TYPES.CHECKBOX}
                        inverted={inverted}
                        label={label}
                        handler={handler}
                        value={value}
                        disabled={sectionDisabled}
                    />
                )}
            >
                {children}
            </SettingsSet>
        </label>
    );
};

SettingsSetCheckbox.propTypes = {
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
};

export { SettingsSetCheckbox };
