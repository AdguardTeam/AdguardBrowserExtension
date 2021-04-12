import React from 'react';
import classNames from 'classnames';

const SettingsSection = (props) => {
    const {
        title,
        description,
        renderBackButton,
        renderInlineControl,
        children,
        disabled,
        subTitle,
    } = props;

    const settingGroupClassName = classNames('settings__group', {
        'settings__group--disabled': disabled,
    });

    const titleContainerClass = classNames('title__container', {
        'title__container--navigation-back': renderBackButton,
    });

    const titleClass = classNames('title', {
        'title--back-btn': renderBackButton,
        'title--sub': subTitle,
    });

    return (
        <div className={settingGroupClassName} key={title}>
            <div className={titleContainerClass}>
                {renderBackButton?.()}
                {title && <h2 className={titleClass}>{title}</h2>}
                {renderInlineControl?.()}
            </div>
            {description && <div className="desc">{description}</div>}
            <div>
                {children}
            </div>
        </div>
    );
};

export { SettingsSection };
