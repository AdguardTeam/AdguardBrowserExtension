/**
 * Copyright (c) 2015-2026 Adguard Software Ltd.
 *
 * @file
 * This file is part of AdGuard Browser Extension (https://github.com/AdguardTeam/AdguardBrowserExtension).
 *
 * AdGuard Browser Extension is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * AdGuard Browser Extension is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with AdGuard Browser Extension. If not, see <http://www.gnu.org/licenses/>.
 */

import React, { type ReactNode } from 'react';

import classNames from 'classnames';

/**
 * Rendering mode of the {@link SettingsSection}, affects title container and
 * title styles.
 */
type SettingsSectionMode = 'smallContainer' | 'subTitle' | 'custom';

/**
 * Props for the {@link SettingsSection} component.
 */
type SettingsSectionProps = {
    /**
     * Section title text.
     */
    title?: string;

    /**
     * Id of the title element, used as `aria-labelledby` target by controls.
     */
    titleId?: string;

    /**
     * Optional icon rendered before the title.
     */
    titleIcon?: ReactNode;

    /**
     * Section description rendered under the title.
     */
    description?: ReactNode;

    /**
     * Render prop for the back button, replaces the title block.
     */
    renderBackButton?: () => ReactNode;

    /**
     * Id of the control associated with the section header label.
     */
    id?: string;

    /**
     * Control rendered inline with the title (e.g. a switcher).
     */
    inlineControl?: ReactNode;

    /**
     * Extra actions rendered in the section header (e.g. a dropdown menu).
     */
    actions?: ReactNode;

    /**
     * Section content.
     */
    children?: ReactNode;

    /**
     * Whether the section is disabled (grayed out and inert).
     */
    disabled?: boolean;

    /**
     * Rendering mode of the section.
     */
    mode?: SettingsSectionMode;

    /**
     * Additional class name for the section container.
     */
    className?: string;
};

const SettingsSection = (props: SettingsSectionProps) => {
    const {
        title,
        titleId,
        titleIcon,
        description,
        renderBackButton,
        id,
        inlineControl,
        actions,
        children,
        disabled,
        mode,
        className,
    } = props;

    const settingGroupClassName = classNames('settings__group', className, {
        'settings__group--disabled': disabled,
    });

    const titleContainerClass = classNames('title__container', {
        'title__container--small': mode === 'smallContainer',
        'title__container--back': renderBackButton,
        'title__container--sub': mode === 'subTitle',
        'title__container--control': id,
        'title__container--custom': mode === 'custom',
        // see renderContent method for detailed explanation
        'title__container--reversed': inlineControl,
    });

    const titleClass = classNames('title', {
        'title--back-btn': renderBackButton,
        'title--sub': mode === 'subTitle',
    });

    const TitleTag = mode === 'subTitle' ? 'h3' : 'h2';

    const info = renderBackButton
        ? renderBackButton()
        : (
            <div className="title__inner">
                {title && (
                    <TitleTag
                        id={titleId}
                        className={titleClass}
                        // Hide title from Screen Readers if it was used as part
                        // of the controls title (aria-labelledby).
                        aria-hidden={!!titleId}
                    >
                        {titleIcon}
                        {title}
                    </TitleTag>
                )}
                {description && (<div className="title__desc">{description}</div>)}
            </div>
        );

    const control = inlineControl && (
        <div
            className="setting__container setting__container--inline setting__inline-control"
        >
            {inlineControl}
        </div>
    );

    /**
     * If inlineControl is provided, we render control first and then info
     * and also we reverse the order by using CSS. This is done to make sure
     * that controls receives first focus when tabbing through the settings.
     */
    const renderContent = () => {
        const content = inlineControl ? [control, info] : [info, control];

        return (
            <>
                {content[0]}
                {content[1]}
            </>
        );
    };

    const header = renderBackButton ? (
        <div className={titleContainerClass}>
            {renderContent()}
        </div>
    ) : (
        <label
            className={titleContainerClass}
            htmlFor={id}
        >
            {renderContent()}
        </label>
    );

    return (
        <div key={title} className={settingGroupClassName} inert={disabled ? '' : undefined}>
            {actions ? (
                <div className="settings__group__header">
                    {header}
                    <div className="settings__group__actions">
                        {actions}
                    </div>
                </div>
            ) : header}
            <div>
                {children}
            </div>
        </div>
    );
};

export { SettingsSection };
