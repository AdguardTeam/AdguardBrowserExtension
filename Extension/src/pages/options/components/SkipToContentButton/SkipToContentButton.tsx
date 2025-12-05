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

import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { translator } from '../../../../common/translators/translator';
import { getFirstNonDisabledElement } from '../../../common/utils/dom';
import { rootStore } from '../../stores/RootStore';

export interface SkipToContentButtonProps {
    /**
     * Reference to the main content element in which we will focus to first interactive element.
     */
    mainRef: React.RefObject<HTMLElement>;
}

export const SkipToContentButton = observer(({ mainRef }: SkipToContentButtonProps) => {
    const { uiStore } = useContext(rootStore);

    const onSkipToContentClick = () => {
        const mainEl = mainRef.current;
        if (!mainEl) {
            return;
        }

        const focusableSelector = `
            a[href],
            button,
            input:not([type="hidden"]),
            select,
            textarea,
            [tabindex]:not([tabindex="-1"]),
            [contenteditable="true"]`;

        const firstNonDisabledElement = getFirstNonDisabledElement(mainEl, focusableSelector);
        if (firstNonDisabledElement) {
            firstNonDisabledElement.focus();
        }
    };

    // Do not render the button if the sidebar is open
    // because main content is not focusable in this case
    if (uiStore.isSidebarOpen) {
        return null;
    }

    return (
        <button
            type="button"
            className="skip-to-content-btn"
            onClick={onSkipToContentClick}
        >
            {translator.getMessage('options_skip_to_main_content')}
        </button>
    );
});
