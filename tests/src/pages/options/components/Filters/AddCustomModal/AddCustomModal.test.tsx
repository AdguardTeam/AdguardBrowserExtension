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

import React from 'react';

import {
    act,
    cleanup,
    fireEvent,
    render,
    screen,
    waitFor,
} from '@testing-library/react';
import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest';

import { AddCustomModal } from '../../../../../../../Extension/src/pages/options/components/Filters/AddCustomModal';
import { rootStore } from '../../../../../../../Extension/src/pages/options/stores/RootStore';
import { messenger } from '../../../../../../../Extension/src/pages/services/messenger';
import { logger } from '../../../../../../../Extension/src/common/logger';

vi.mock('react-modal', () => {
    function MockModal({ isOpen, children }: any) {
        return isOpen ? <div>{children}</div> : null;
    }

    return {
        default: Object.assign(MockModal, { setAppElement: vi.fn() }),
    };
});

vi.mock('../../../../../../../Extension/src/common/translators/translator', () => ({
    translator: {
        getMessage: (key: string) => key,
    },
}));

vi.mock('../../../../../../../Extension/src/common/logger', () => ({
    logger: {
        error: vi.fn(),
        warn: vi.fn(),
        info: vi.fn(),
        debug: vi.fn(),
        trace: vi.fn(),
    },
}));

vi.mock('../../../../../../../Extension/src/pages/services/messenger', () => ({
    messenger: {
        checkCustomUrl: vi.fn(),
    },
}));

vi.mock('../../../../../../../Extension/src/pages/common/components/helpers', () => ({
    addMinDelayLoader: (_setShowLoader: unknown, callback: (...args: unknown[]) => Promise<unknown>) => callback,
}));

vi.mock('../../../../../../../Extension/src/pages/options/components/Filters/AddCustomInput', () => {
    function MockAddCustomInput({ value, onChange, disabled }: any) {
        return (
            <input
                data-testid="add-custom-input"
                value={value ?? ''}
                disabled={disabled}
                onChange={(e) => onChange?.(e.target.value)}
            />
        );
    }

    return { AddCustomInput: MockAddCustomInput };
});

vi.mock('../../../../../../../Extension/src/pages/common/components/ModalContentWrapper/ModalContentWrapper', () => ({
    ModalContentWrapper: ({ title, actions, children }: any) => (
        <div>
            <div>{title}</div>
            {children}
            {actions}
        </div>
    ),
}));

vi.mock('../../../../../../../Extension/src/pages/common/components/ui/Icon', () => ({
    Icon: () => null,
}));

vi.mock('../../../../../../../Extension/src/pages/common/styles/theme', () => ({
    default: {
        modal: {
            overlay: 'overlay',
            wrapper: 'wrapper',
            btn: 'btn',
        },
    },
}));

vi.mock(
    '../../../../../../../Extension/src/pages/options/components/Filters/AddCustomModal/AddCustomModal.module.pcss',
    () => ({ default: {} }),
);

const CUSTOM_URL = 'https://example.org/filter.txt';

const FILTER_INFO = {
    name: 'Example filter',
    description: 'Example description',
    version: '1.0.0.0',
    rulesCount: 10,
    homepage: 'https://example.org',
    customUrl: CUSTOM_URL,
    timeUpdated: '2026-01-01T00:00:00.000Z',
};

/**
 * Creates a mocked root store value.
 *
 * @param addCustomFilter Mocked `settingsStore.addCustomFilter` implementation.
 * @param checkLimitations Mocked `settingsStore.checkLimitations` implementation.
 *
 * @returns Root store value.
 */
const createRootValue = (
    addCustomFilter: (...args: unknown[]) => Promise<unknown>,
    checkLimitations: () => Promise<unknown> = () => Promise.resolve(undefined),
) => ({
    settingsStore: {
        addCustomFilter: vi.fn(addCustomFilter),
        checkLimitations: vi.fn(checkLimitations),
    },
    uiStore: {
        setShowLoader: vi.fn(),
    },
});

/**
 * Creates the modal element for the given root store value.
 *
 * @param rootValue Mocked root store value.
 * @param closeModalHandler Mocked close handler.
 * @param modalIsOpen Whether the modal is open.
 *
 * @returns React element.
 */
const createModalElement = (
    rootValue: ReturnType<typeof createRootValue>,
    closeModalHandler: () => void,
    modalIsOpen: boolean,
) => React.createElement(
    rootStore.Provider as any,
    { value: rootValue },
    React.createElement(AddCustomModal, {
        closeModalHandler,
        modalIsOpen,
        initialUrl: CUSTOM_URL,
        initialTitle: '',
    }),
);

/**
 * Renders the modal and moves it to the approve step.
 *
 * @param rootValue Mocked root store value.
 * @param closeModalHandler Mocked close handler.
 *
 * @returns Render result.
 */
const renderApproveStep = async (
    rootValue: ReturnType<typeof createRootValue>,
    closeModalHandler: () => void,
) => {
    const renderResult = render(createModalElement(rootValue, closeModalHandler, true));

    fireEvent.click(screen.getByText('options_popup_next_button'));
    await screen.findByText('options_add_custom_filter_modal_add_button');

    return renderResult;
};

describe('AddCustomModal approve step', () => {
    beforeEach(() => {
        vi.mocked(messenger.checkCustomUrl).mockResolvedValue({ filter: FILTER_INFO } as any);
    });

    afterEach(() => {
        cleanup();
        vi.clearAllMocks();
    });

    it('keeps the modal open and shows the error step when adding a filter fails', async () => {
        const closeModalHandler = vi.fn();
        const error = new Error('Network error');
        const rootValue = createRootValue(() => Promise.reject(error));

        await renderApproveStep(rootValue, closeModalHandler);

        fireEvent.click(screen.getByText('options_add_custom_filter_modal_add_button'));

        await screen.findByText('options_add_custom_filter_modal_error_title');
        expect(screen.getByText('options_add_custom_filter_modal_error_subtitle')).toBeTruthy();
        expect(closeModalHandler).not.toHaveBeenCalled();
        expect(logger.error).toHaveBeenCalledWith('[ext.AddCustomModal]: error: ', error);
    });

    it('shows the error step when the store returns no filter data', async () => {
        const closeModalHandler = vi.fn();
        const rootValue = createRootValue(() => Promise.resolve(undefined));

        await renderApproveStep(rootValue, closeModalHandler);

        fireEvent.click(screen.getByText('options_add_custom_filter_modal_add_button'));

        await screen.findByText('options_add_custom_filter_modal_error_title');
        expect(closeModalHandler).not.toHaveBeenCalled();
        expect(logger.error).toHaveBeenCalled();
    });

    it('closes the modal when the filter is added successfully', async () => {
        const closeModalHandler = vi.fn();
        const rootValue = createRootValue(() => Promise.resolve(42));

        await renderApproveStep(rootValue, closeModalHandler);

        fireEvent.click(screen.getByText('options_add_custom_filter_modal_add_button'));

        await waitFor(() => expect(closeModalHandler).toHaveBeenCalledTimes(1));
    });

    it.skipIf(!__IS_MV3__)('closes the modal when checking limitations fails after a successful add', async () => {
        const closeModalHandler = vi.fn();
        const limitationsError = new Error('Limitations check failed');
        const rootValue = createRootValue(
            () => Promise.resolve(42),
            () => Promise.reject(limitationsError),
        );

        await renderApproveStep(rootValue, closeModalHandler);

        fireEvent.click(screen.getByText('options_add_custom_filter_modal_add_button'));

        await waitFor(() => expect(closeModalHandler).toHaveBeenCalledTimes(1));
        expect(screen.queryByText('options_add_custom_filter_modal_error_title')).toBeNull();
        expect(logger.error).toHaveBeenCalledWith(
            '[ext.AddCustomModal]: failed to check limitations: ',
            limitationsError,
        );
    });

    it('returns to the input step and resets the loading state when retrying after a failure', async () => {
        const closeModalHandler = vi.fn();
        const rootValue = createRootValue(() => Promise.reject(new Error('Network error')));

        await renderApproveStep(rootValue, closeModalHandler);

        fireEvent.click(screen.getByText('options_add_custom_filter_modal_add_button'));
        await screen.findByText('options_add_custom_filter_modal_error_title');

        fireEvent.click(screen.getByText('options_popup_try_again_button'));

        // "Try again" must return to the input step.
        expect(screen.getByText('options_popup_next_button')).toBeTruthy();

        // The retry must reach the approve step with an enabled Add button,
        // i.e. the loading state was really reset after the failure.
        fireEvent.click(screen.getByText('options_popup_next_button'));
        await screen.findByText('options_add_custom_filter_modal_add_button');

        expect(
            (screen.getByText('options_add_custom_filter_modal_add_button') as HTMLButtonElement).disabled,
        ).toBe(false);
    });

    it('ignores an add failure that arrives after the modal was closed', async () => {
        const closeModalHandler = vi.fn();
        const deferred = Promise.withResolvers<unknown>();
        const rootValue = createRootValue(() => deferred.promise);

        const { rerender } = await renderApproveStep(rootValue, closeModalHandler);

        fireEvent.click(screen.getByText('options_add_custom_filter_modal_add_button'));

        // Close the modal while the add is in flight.
        fireEvent.keyDown(document, { key: 'Escape' });
        rerender(createModalElement(rootValue, closeModalHandler, false));

        // The failure arrives when the modal is already closed.
        await act(async () => {
            deferred.reject(new Error('Network error'));
        });

        // The next open must start from the input step.
        rerender(createModalElement(rootValue, closeModalHandler, true));

        expect(screen.getByText('options_popup_next_button')).toBeTruthy();
        expect(screen.queryByText('options_add_custom_filter_modal_error_title')).toBeNull();
    });

    it('does not close a reopened modal when the add succeeds after the modal was closed', async () => {
        const closeModalHandler = vi.fn();
        const deferred = Promise.withResolvers<unknown>();
        const rootValue = createRootValue(() => deferred.promise);

        const { rerender } = await renderApproveStep(rootValue, closeModalHandler);

        fireEvent.click(screen.getByText('options_add_custom_filter_modal_add_button'));

        fireEvent.keyDown(document, { key: 'Escape' });
        rerender(createModalElement(rootValue, closeModalHandler, false));

        // Reopen the modal before the response arrives.
        rerender(createModalElement(rootValue, closeModalHandler, true));

        await act(async () => {
            deferred.resolve(42);
        });

        // Only the ESC close must be reported: the late success must not close
        // the modal that the user opened again.
        expect(closeModalHandler).toHaveBeenCalledTimes(1);
        expect(screen.getByText('options_popup_next_button')).toBeTruthy();
    });

    it('ignores an add success that arrives after the modal was unmounted', async () => {
        const closeModalHandler = vi.fn();
        const deferred = Promise.withResolvers<unknown>();
        const rootValue = createRootValue(() => deferred.promise);

        const { unmount } = await renderApproveStep(rootValue, closeModalHandler);

        fireEvent.click(screen.getByText('options_add_custom_filter_modal_add_button'));

        // Leave the page while the add is in flight.
        unmount();

        await act(async () => {
            deferred.resolve(42);
        });

        // The late success must not close a modal that is not mounted anymore.
        expect(closeModalHandler).not.toHaveBeenCalled();
    });

    it('ignores a URL check result that arrives after the modal was closed', async () => {
        const closeModalHandler = vi.fn();
        const deferred = Promise.withResolvers<unknown>();
        vi.mocked(messenger.checkCustomUrl).mockReturnValue(deferred.promise as any);
        const rootValue = createRootValue(() => Promise.resolve(42));

        const { rerender } = render(createModalElement(rootValue, closeModalHandler, true));

        fireEvent.click(screen.getByText('options_popup_next_button'));

        fireEvent.keyDown(document, { key: 'Escape' });
        rerender(createModalElement(rootValue, closeModalHandler, false));

        await act(async () => {
            deferred.resolve({ filter: FILTER_INFO });
        });

        rerender(createModalElement(rootValue, closeModalHandler, true));

        expect(screen.getByText('options_popup_next_button')).toBeTruthy();
        expect(screen.queryByText('options_add_custom_filter_modal_add_button')).toBeNull();
    });
});
