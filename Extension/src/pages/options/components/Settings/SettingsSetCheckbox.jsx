import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Setting, SETTINGS_TYPES } from './Setting';

const SettingsSetCheckbox = (props) => {
    const {
        title, description, children, disabled, hideBorder,
        id, handler, label, inverted,
    } = props;
    const settingClassName = classNames('setting setting--checkbox', {
        'setting--disabled': disabled,
        'setting--hide-border': hideBorder,
    });

    let { value } = props;

    value = inverted ? !value : value;

    const changeHandler = (e) => {
        // eslint-disable-next-line no-shadow
        const { target: { name: id, checked: data } } = e;
        handler({ id, data: inverted ? !data : data });
    };

    return (
        <label
            htmlFor={id}
            className={settingClassName}
        >
            <input
                type="checkbox"
                name={id}
                checked={value}
                onChange={changeHandler}
                id={id}
                className="setting__checkbox"
                tabIndex="0"
            />
            <div className="setting__container setting__container--vertical">
                <div className="setting__container setting__container--horizontal">
                    <div className="setting__info">
                        <div className="setting__title">{title}</div>
                        {description && <div className="setting__desc">{description}</div>}
                    </div>
                    <Setting
                        id={id}
                        type={SETTINGS_TYPES.CHECKBOX}
                        value={value}
                        label={label}
                        handler={handler}
                        inverted
                    />
                </div>
                {children}
            </div>
        </label>
    );
};

SettingsSetCheckbox.defaultProps = {
    title: '',
    description: '',
    children: null,
    disabled: false,
    value: false,
    inverted: false,
    label: '',
};

SettingsSetCheckbox.propTypes = {
    title: PropTypes.string,
    description: PropTypes.oneOfType([PropTypes.string, PropTypes.element]),
    children: PropTypes.oneOfType([
        PropTypes.element,
        PropTypes.arrayOf(PropTypes.element),
    ]),
    disabled: PropTypes.bool,
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    value: PropTypes.bool,
    inverted: PropTypes.bool,
    handler: PropTypes.func.isRequired,
    label: PropTypes.string,
};

export { SettingsSetCheckbox };
