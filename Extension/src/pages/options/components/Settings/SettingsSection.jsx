import React from 'react';
import classNames from 'classnames';

const SettingsSection = (props) => {
    const {
        title,
        description,
        renderBackButton,
        id,
        inlineControl,
        children,
        disabled,
        mode,
    } = props;

    const settingGroupClassName = classNames('settings__group', {
        'settings__group--disabled': disabled,
    });

    const titleContainerClass = classNames('title__container', {
        'title__container--small': mode === 'smallContainer',
        'title__container--back': renderBackButton,
        'title__container--sub': mode === 'subTitle',
        'title__container--control': id,
    });

    const titleClass = classNames('title', {
        'title--back-btn': renderBackButton,
        'title--sub': mode === 'subTitle',
    });

    return (
        <div className={settingGroupClassName} key={title}>
            <label
                className={titleContainerClass}
                htmlFor={id}
            >
                {renderBackButton
                    ? renderBackButton()
                    : (
                        <div className="title__inner">
                            {title && <h2 className={titleClass}>{title}</h2>}
                            {description && <div className="title__desc">{description}</div>}
                        </div>
                    )}
                {inlineControl
                    && (
                        <div
                            className="setting__container setting__container--inline setting__inline-control"
                        >
                            {inlineControl}
                        </div>
                    )}
            </label>
            <div>
                {children}
            </div>
        </div>
    );
};

export { SettingsSection };
