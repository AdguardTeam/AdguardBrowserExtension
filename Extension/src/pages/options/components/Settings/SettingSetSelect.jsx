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

import React from 'react';

import cn from 'classnames';

import { useSelect } from '../../../common/components/ui/Select/SelectProvider';

import { SettingsSet } from './SettingsSet';
import { Setting, SETTINGS_TYPES } from './Setting';

export const SettingSetSelect = ({
    title,
    description,
    ...props
}) => {
    const [hidden, setHidden] = useSelect(props.id);
    const titleId = `${props.id}-title`;

    const handleSettingClick = (e) => {
        e.stopPropagation();
        setHidden(!hidden);
    };

    return (
        // Interaction with the keyboard creates problems,
        // leaving the possibility of interaction through
        // the keyboard only with the internal selector
        // eslint-disable-next-line max-len
        // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
        <div
            className={cn('setting-checkbox', 'setting-checkbox--button', props.className)}
            onClick={handleSettingClick}
        >
            <SettingsSet
                title={title}
                titleId={titleId}
                description={description}
                inlineControl={(
                    <Setting
                        type={SETTINGS_TYPES.SELECT}
                        labelId={titleId}
                        {...props}
                    />
                )}
            />
        </div>
    );
};
