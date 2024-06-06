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

import React from 'react';

import { AttachmentPortal } from '../../../common/components/AttachmentPortal';
import { Icon } from '../../../common/components/ui/Icon';

import './loader.pcss';

type LoaderParams = {
    /**
     * Flag whether to show loader or not.
     */
    showLoader: boolean,
};

export const Loader = ({ showLoader }: LoaderParams) => {
    const LOADER_POSITION = {
        x: 0,
        y: 0,
    };

    return (
        <>
            {showLoader && (
                <AttachmentPortal rootId="root-portal" position={LOADER_POSITION}>
                    <div className="loader">
                        <div className="loader__background">
                            <div>
                                <Icon
                                    id="#popup-loading"
                                    classname="icon--popup-loading"
                                    animationCondition={showLoader}
                                    animationClassname="icon--loading"
                                />
                            </div>
                        </div>
                    </div>
                </AttachmentPortal>
            )}
        </>
    );
};
