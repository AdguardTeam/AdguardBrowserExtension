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

import cn from 'classnames';

import { Icon } from '../ui/Icon';
import { translator } from '../../../../common/translators/translator';

import modalStyles from '../../styles/modal.module.pcss';

/**
 * Props for the ModalContentWrapper component.
 */
type ModalContentWrapperProps = {
    closeModalHandler: () => void;
    children: ReactNode;
    title?: string;
    actions?: ReactNode;
    className?: string;
    showCloseButton?: boolean;
    /**
     * Image will be positioned to the left of the content, if provided
     */
    image?: ReactNode;
};

/**
 * Shared modal content wrapper component with optional image and actions.
 */
const ModalContentWrapper = ({
    closeModalHandler,
    title = '',
    actions,
    children,
    className,
    showCloseButton = true,
    image,
}: ModalContentWrapperProps) => {
    const renderedCloseBtn = showCloseButton && (
        <button
            type="button"
            className={`button ${modalStyles.btnClose}`}
            onClick={closeModalHandler}
            title={translator.getMessage('close_button_title')}
        >
            <Icon id="#cross" aria-hidden="true" />
        </button>
    );

    const renderedTitle = title && (
        <div className={modalStyles.title}>
            {title}
        </div>
    );

    const renderedActions = actions && (
        <div className={modalStyles.actions}>
            {actions}
        </div>
    );

    /**
     * Modal with image has different layout: two columns (image + content)
     */
    if (image) {
        return (
            <div className={cn(modalStyles.modal, modalStyles.modalWithImage, className)}>
                {renderedCloseBtn}
                {/* On mobile (≤640 px) the layout switches to a single column.
                  * The title moves here (above the image) and is hidden on desktop
                  * via `modalHeader { display: none }` in the stylesheet. */}
                <div className={modalStyles.modalHeader}>
                    {renderedTitle}
                </div>
                <div className={modalStyles.imageColumn}>
                    {image}
                </div>
                <div className={modalStyles.textColumn}>
                    {/* On desktop the title lives here, next to the image column.
                      * On mobile this copy is hidden via `.textColumn .title { display: none }`,
                      * and the modalHeader copy above is shown instead. */}
                    {renderedTitle}
                    {children}
                    {renderedActions}
                </div>
            </div>
        );
    }

    return (
        <div className={cn(modalStyles.modal, className)}>
            <div className={modalStyles.content}>
                <div className={modalStyles.header}>
                    {renderedTitle}
                    {renderedCloseBtn}
                </div>
                {children}
            </div>

            {renderedActions}
        </div>
    );
};

export { ModalContentWrapper };
