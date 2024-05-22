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
import { observer } from 'mobx-react';

import { translator } from '../../../../common/translators/translator';
import { AttachmentPortal } from '../AttachmentPortal';
import { Icon } from '../ui/Icon';

import './loader.pcss';

type LoaderParams = {
    /**
     * Condition to show the loader.
     */
    condition: boolean,
};

export const Loader = observer(({ condition }: LoaderParams) => {
    const LOADER_POSITION = {
        x: 0,
        y: 0,
    };

    return (
        <>
            {condition && (
                <AttachmentPortal rootId="root-portal" position={LOADER_POSITION}>
                    <div className="loader">
                        <div className="loader__background">
                            <div className="loader__container">
                                <div className="loader__content">
                                    <Icon
                                        id="#loading"
                                        classname="icon--24"
                                        animationCondition={condition}
                                        animationClassname="icon--loading"
                                    />
                                    <div className="loader__text">
                                        {translator.getMessage('options_loader_applying_changes')}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </AttachmentPortal>
            )}
        </>
    );
});
