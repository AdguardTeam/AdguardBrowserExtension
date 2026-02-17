/**
 * Copyright (c) 2015-2025 Adguard Software Ltd.
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

import cn from 'classnames';

import { type SettingOption } from '../../../../background/schema';
import { type SettingHandler } from '../../types';

import { Setting, SETTINGS_TYPES } from './Setting';
import { SettingsSet } from './SettingsSet';

type SettingsSetCheckboxProps = {
    id: SettingOption | string;
    title: string;
    label: string;
    value: boolean;
    handler: SettingHandler;
    description?: ReactNode;
    children?: ReactNode;
    disabled?: boolean;
    inverted?: boolean;
    sectionDisabled?: boolean;
    className?: string;
};

const SettingsSetCheckbox = ({
    id,
    title,
    label,
    value,
    handler,
    description,
    children,
    disabled,
    inverted,
    sectionDisabled,
    className = '',
}: SettingsSetCheckboxProps) => {
    const titleId = `${id}-title`;

    return (
        <label
            htmlFor={id}
            className={cn('setting-checkbox', className)}
        >
            <SettingsSet
                title={title}
                titleId={titleId}
                description={description}
                disabled={disabled}
                inlineControl={(
                    <Setting
                        id={id}
                        type={SETTINGS_TYPES.CHECKBOX}
                        inverted={inverted}
                        label={label}
                        labelId={titleId}
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

export { SettingsSetCheckbox };
