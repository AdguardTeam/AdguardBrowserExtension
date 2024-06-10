/**
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

import React, { useRef, useEffect } from 'react';

import cn from 'classnames';

import { useOutsideClick } from '../../../hooks/useOutsideClick';
import { useOutsideFocus } from '../../../hooks/useOutsideFocus';
import { Icon } from '../Icon';

import './select.pcss';

/**
 * Single option for select.
 */
type SelectOption = {
    /**
     * Option value.
     */
    value: string,

    /**
     * Option title.
     */
    title: string,
};

/**
 * Select component parameters.
 */
type SelectParams = {
    /**
     * Select id.
     */
    id: string,

    /**
     * Select change handler.
     */
    handler: (value: string) => void,

    /**
     * List of select options.
     */
    options: SelectOption[],

    /**
     * Current select value.
     */
    value: string,

    /**
     * Select visibility.
     */
    hidden: boolean,

    /**
     * Set select visibility.
     */
    setHidden: (value: boolean) => void,

    /**
     * Flag whether the select is used in popup.
     */
    popupModification?: boolean,
};

export const Select = ({
    id,
    handler,
    options,
    value,
    hidden,
    setHidden,
    popupModification = false,
}: SelectParams): React.JSX.Element | null => {
    const ref = useRef(null);
    const refList = useRef(null);

    const renderItems = (options: SelectOption[]) => options.map((option) => {
        const { value: currentValue, title } = option;

        const handleOptionClick = (e: React.MouseEvent<HTMLButtonElement>) => {
            e.stopPropagation();
            handler(currentValue);
            setHidden(true);
        };

        return (
            <button
                type="button"
                className="select__item"
                onClick={handleOptionClick}
                key={currentValue}
                value={currentValue}
            >
                {title}
            </button>
        );
    });

    useEffect(() => {
        return () => {
            setHidden(true);
        };
    }, [setHidden]);

    useOutsideClick(ref, () => {
        setHidden(true);
    });

    useOutsideFocus(refList, () => {
        setHidden(true);
    });

    const handleSelectClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        setHidden(!hidden);
    };

    const currentValue = options.find((i) => i.value === value);

    if (!currentValue) {
        return null;
    }

    const currentTitle = currentValue.title;

    return (
        <div
            id={id}
            ref={ref}
            className={cn('select', popupModification ? 'popup-modification' : '')}
        >
            <button
                type="button"
                className="select__value"
                onClick={handleSelectClick}
            >
                {currentTitle}
            </button>
            <Icon
                id="#select"
                classname="icon--select select__ico"
            />
            {!hidden && (
                <div
                    className="select__list"
                    ref={refList}
                >
                    {renderItems(options)}
                </div>
            )}
        </div>
    );
};
