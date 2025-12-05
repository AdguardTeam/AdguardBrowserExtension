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

import React, {
    useCallback,
    useEffect,
    useRef,
} from 'react';
import { useBlocker, type BlockerFunction } from 'react-router-dom';

import { noop } from 'lodash-es';

import { ConfirmModal } from '../ConfirmModal';
import { translator } from '../../../../common/translators/translator';

export type EditorLeaveModalProps = {
    /**
     * Title of modal
     */
    title: string;

    /**
     * Subtitle of modal
     */
    subtitle: string;
};

const EditorLeaveModal = ({ title, subtitle }: EditorLeaveModalProps) => {
    /**
     * It seems like react-router-dom has a bug related with `useBlocker` hook,
     * when we navigate back/forward with the browser's native controls it doesn't
     * clears blockers and it gets stuck forever in that state.
     * Do not remove it.
     * See https://github.com/remix-run/react-router/issues/11430
     */
    const isMountedRef = useRef<boolean>(false);
    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    const shouldBlock = useCallback<BlockerFunction>(
        ({ currentLocation, nextLocation }) => (
            isMountedRef.current
            && currentLocation.pathname !== nextLocation.pathname
        ),
        [],
    );

    const routeBlocker = useBlocker(shouldBlock);

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
