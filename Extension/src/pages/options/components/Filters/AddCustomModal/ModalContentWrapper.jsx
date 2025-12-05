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

import PropTypes from 'prop-types';

import { Icon } from '../../../../common/components/ui/Icon';
import { translator } from '../../../../../common/translators/translator';

import modalStyles from '../../../../common/styles/modal.module.pcss';

const ModalContentWrapper = ({
    closeModalHandler,
    title,
    actions,
    children,
}) => {
    return (
        <div className={modalStyles.modal}>
            <div className={modalStyles.content}>
                <div className={modalStyles.header}>
                    {title && (
                        <div className={modalStyles.title}>
                            {title}
                        </div>
                    )}
                    <button
                        type="button"
                        className={`button ${modalStyles.btnClose}`}
                        onClick={closeModalHandler}
                        title={translator.getMessage('close_button_title')}
                    >
                        <Icon id="#cross" aria-hidden="true" />
                    </button>
                </div>
                {children}
            </div>
            {actions && (
                <div className={modalStyles.actions}>
                    {actions}
                </div>
            )}
        </div>
    );
};

ModalContentWrapper.defaultProps = {
    title: '',
};

ModalContentWrapper.propTypes = {
    closeModalHandler: PropTypes.func.isRequired,
    children: PropTypes.oneOfType([PropTypes.array, PropTypes.object]).isRequired,
    title: PropTypes.string,
    actions: PropTypes.node,
};

export { ModalContentWrapper };
