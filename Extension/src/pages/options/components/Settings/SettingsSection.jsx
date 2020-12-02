import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

const SettingsSection = (props) => {
    const {
        title, subtitle, description, renderBackButton, renderInlineControl, children, disabled,
    } = props;

    const settingGroupClassName = classNames('settings__group', {
        'settings__group--disabled': disabled,
    });

    const titleContainerClass = classNames('title__container', {
        'title__container--navigation-back': renderBackButton,
    });

    const titleClass = classNames('title', {
        'title--back-btn': renderBackButton,
    });

    return (
        <div key={title}>
            <div className={titleContainerClass}>
                {renderBackButton?.()}
                {title && <h2 className={titleClass}>{title}</h2>}
                {renderInlineControl?.()}
            </div>
            {description && <div className="desc">{description}</div>}
            <div className={settingGroupClassName}>
                {subtitle && <h3 className="subtitle">{subtitle}</h3>}
                {children}
            </div>
        </div>
    );
};

SettingsSection.defaultProps = {
    title: '',
    subtitle: '',
    description: '',
    renderInlineControl: undefined,
    renderBackButton: undefined,
    disabled: false,
};

SettingsSection.propTypes = {
    title: PropTypes.string,
    subtitle: PropTypes.string,
    description: PropTypes.string,
    renderInlineControl: PropTypes.func,
    renderBackButton: PropTypes.func,
    children: PropTypes.oneOfType([
        PropTypes.object,
        PropTypes.arrayOf(PropTypes.node),
    ]).isRequired,
    disabled: PropTypes.bool,
};

export { SettingsSection };
