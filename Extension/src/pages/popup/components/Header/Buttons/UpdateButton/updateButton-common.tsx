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

import React, { type KeyboardEvent, type MouseEvent } from 'react';

import { Icon } from '../../../../../common/components/ui/Icon';

export const UpdateButtonCommon = ({
    isUpdating,
    statusMessage = '',
    onClick,
    buttonTitle,
    children,
}: {
    isUpdating: boolean;
    statusMessage?: string;
    onClick: (e: MouseEvent | KeyboardEvent) => void;
    buttonTitle: string;
    children?: React.ReactNode;
}) => {
    return (
        <>
            <div
                role="status"
                className="sr-only"
                aria-live="assertive"
                tabIndex={-1}
                aria-hidden={!isUpdating || !statusMessage}
            >
                {statusMessage}
            </div>
            <button
                className="button popup-header__button"
                disabled={isUpdating}
                type="button"
                onClick={onClick}
                title={buttonTitle}
            >
                {children || (
                    <Icon
                        id="#reload"
                        className="icon--24 icon--header"
                        animationCondition={isUpdating}
                        animationClassName="icon--loading"
                        aria-hidden="true"
                    />
                )}
            </button>
        </>
    );
};
