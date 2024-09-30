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
import { useBlocker } from 'react-router-dom';

import { noop } from 'lodash';

import { ConfirmModal } from '../ConfirmModal';
import { translator } from '../../../../common/translators/translator';
import { usePreventUnload } from '../../hooks/usePreventUnload';

export type EditorLeaveModalProps = {
    /**
     * Subtitle of modal
     */
    subtitle: string;

    /**
     * Flag that indicates is content saving or not
     */
    isSaving: boolean;

    /**
     * Flag that indicates is content changed or not
     */
    contentChanged: boolean;
};

const EditorLeaveModal = ({ subtitle, isSaving, contentChanged }: EditorLeaveModalProps) => {
    const title = translator.getMessage('options_editor_leave_title');
    const isUnsaved = contentChanged && !isSaving;
    const routeBlocker = useBlocker(
        ({ currentLocation, nextLocation }) => isUnsaved && currentLocation.pathname !== nextLocation.pathname,
    );

    const onConfirmHandler = () => {
        if (routeBlocker.state !== 'blocked') {
            return;
        }

        routeBlocker.proceed();
    };

    const onCancelHandler = () => {
        if (routeBlocker.state !== 'blocked') {
            return;
        }

        routeBlocker.reset();
    };

    usePreventUnload(contentChanged, `${title} ${subtitle}`);

    if (routeBlocker.state !== 'blocked') {
        return null;
    }

    return (
        <ConfirmModal
            title={title}
            subtitle={subtitle}
            isOpen={routeBlocker.state === 'blocked'}
            // We ignore it because setIsOpen(false) calls both in onConfirm and onCancel
            setIsOpen={noop}
            onConfirm={onConfirmHandler}
            onCancel={onCancelHandler}
            customConfirmTitle={translator.getMessage('options_editor_leave_confirm')}
            customCancelTitle={translator.getMessage('options_editor_leave_cancel')}
        />
    );
};

export { EditorLeaveModal };
