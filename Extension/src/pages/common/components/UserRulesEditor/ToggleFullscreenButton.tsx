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

import { translator } from '../../../../common/translators/translator';
import { Popover } from '../ui/Popover';
import { Icon } from '../ui/Icon';

export interface ToggleFullscreenButtonProps {
    /**
     * Flag to set fullscreen mode.
     */
    fullscreen: boolean;

    /**
     * Handler to toggle fullscreen mode.
     */
    onClick: () => void;
}

export const ToggleFullscreenButton = ({ fullscreen, onClick }: ToggleFullscreenButtonProps) => {
    const iconId = fullscreen ? '#reduce' : '#extend';

    const tooltipText = fullscreen
        ? translator.getMessage('options_editor_close_fullscreen_button_tooltip')
        : translator.getMessage('options_editor_open_fullscreen_button_tooltip');

    return (
        <Popover text={tooltipText}>
            <button
                type="button"
                className="button actions__btn actions__btn--icon"
                onClick={onClick}
                aria-label={tooltipText}
            >
                <Icon
                    id={iconId}
                    className="icon--24 icon--gray-default"
                    aria-hidden="true"
                />
            </button>
        </Popover>
    );
};
