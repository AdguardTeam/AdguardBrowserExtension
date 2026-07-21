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

import React, {
    useCallback,
    useEffect,
    useRef,
} from 'react';
import { useBlocker, type BlockerFunction } from 'react-router-dom';

import { noop } from 'lodash-es';

import { ConfirmModal } from '../ConfirmModal';
import { translator } from '../../../../common/translators/translator';

type EditorLeaveModalProps = {
    /**
     * Title of modal.
     */
    title: string;

    /**
     * Subtitle of modal.
     */
    subtitle: string;

    /**
     * Optional controlled mode.
     *
     * When omitted, the modal is driven by the route blocker and must be rendered inside a router context.
     */
    isOpen?: boolean;

    /**
     * Confirm ("leave") handler for the controlled mode.
     */
    onConfirm?: () => void;

    /**
     * Cancel ("back to editing") handler for the controlled mode.
     */
    onCancel?: () => void;
};

/**
 * Renders the leave-without-saving confirmation modal UI. Shared by both the
 * route-blocker mode and the controlled mode.
 */
const EditorLeaveModalView = ({
    title,
    subtitle,
    isOpen,
    onConfirm,
    onCancel,
}: EditorLeaveModalProps) => {
    if (!isOpen) {
        return null;
    }

    return (
        <ConfirmModal
            title={title}
            subtitle={subtitle}
            isOpen={isOpen}
            // We ignore it because setIsOpen(false) calls both in onConfirm and onCancel
            setIsOpen={noop}
            onConfirm={onConfirm ?? noop}
            onCancel={onCancel}
            customConfirmTitle={translator.getMessage('options_editor_leave_confirm')}
            customCancelTitle={translator.getMessage('options_editor_leave_cancel')}
        />
    );
};

/**
 * Route-blocker mode. Blocks in-app navigation while there are unsaved changes
 * and asks the user to confirm leaving. Must be rendered inside a router.
 */
const EditorLeaveModalRoute = ({ title, subtitle }: Pick<EditorLeaveModalProps, 'title' | 'subtitle'>) => {
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

    return (
        <EditorLeaveModalView
            title={title}
            subtitle={subtitle}
            isOpen={routeBlocker.state === 'blocked'}
            onConfirm={onConfirmHandler}
            onCancel={onCancelHandler}
        />
    );
};

const EditorLeaveModal = ({
    title,
    subtitle,
    isOpen,
    onConfirm,
    onCancel,
}: EditorLeaveModalProps) => {
    // Controlled mode: the parent decides when to show the modal and what to do
    // on confirm/cancel. This does not require a router context.
    if (isOpen !== undefined) {
        return (
            <EditorLeaveModalView
                title={title}
                subtitle={subtitle}
                isOpen={isOpen}
                onConfirm={onConfirm}
                onCancel={onCancel}
            />
        );
    }

    return (
        <EditorLeaveModalRoute title={title} subtitle={subtitle} />
    );
};

export { EditorLeaveModal };
