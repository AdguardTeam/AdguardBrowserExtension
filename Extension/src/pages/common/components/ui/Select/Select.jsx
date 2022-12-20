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
import { useOutsideClick } from '../../../hooks/useOutsideClick';
import { useOutsideFocus } from '../../../hooks/useOutsideFocus';
import { useSelect } from './SelectProvider';
import { Icon } from '../Icon';

import './select.pcss';

export const Select = ({
    id,
    handler,
    options,
    value,
}) => {
    const ref = useRef(null);
    const refList = useRef(null);

    const [hidden, setHidden] = useSelect(id);

    const renderItems = () => options.map((option) => {
        const { value: currentValue, title } = option;

        const handleOptionClick = (e) => {
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

    const handleSelectClick = (e) => {
        e.stopPropagation();
        setHidden(!hidden);
    };

    const currentValue = options.find((i) => i.value === value);
    const currentTitle = currentValue.title;

    return (
        <div id={id} className="select" ref={ref}>
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
