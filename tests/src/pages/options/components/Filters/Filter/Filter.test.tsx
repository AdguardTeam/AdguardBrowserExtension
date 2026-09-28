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

import React, { createContext } from 'react';

import {
    cleanup,
    render,
    screen,
} from '@testing-library/react';
import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest';

vi.mock('../../../../../../../Extension/src/common/translators/translator', () => ({
    translator: {
        getMessage: (key: string) => key,
    },
}));

vi.mock('../../../../../../../Extension/src/pages/services/messenger', () => ({
    messenger: {
        getIsConsentedFilter: vi.fn(),
    },
}));

vi.mock('../../../../../../../Extension/src/pages/options/components/Filters/filter.pcss', () => ({}));

vi.mock('../../../../../../../Extension/src/pages/options/components/Settings/Setting', () => ({
    Setting: () => null,
    SETTINGS_TYPES: { CHECKBOX: 'checkbox' },
}));

vi.mock('../../../../../../../Extension/src/pages/common/components/ui/Icon', () => ({
    Icon: () => null,
}));

vi.mock('../../../../../../../Extension/src/pages/common/components/ConfirmModal', () => ({
    ConfirmModal: () => null,
}));

vi.mock('../../../../../../../Extension/src/pages/common/components/ui/Popover', () => ({
    Popover: ({ children }: any) => React.createElement('div', null, children),
}));

vi.mock('../../../../../../../Extension/src/pages/options/components/Filters/Search/HighlightSearch', () => ({
    HighlightSearch: ({ string }: any) => React.createElement('span', null, string),
}));

const UNUSED_STATUS_KEY = 'options_filters_filter_disabled_as_unused';

/**
 * Creates filter data for tests.
 *
 * @param overrides Filter properties to override.
 *
 * @returns Filter data.
 */
const createFilter = (overrides: Record<string, unknown> = {}): any => ({
    filterId: 1,
    groupId: 7,
    name: 'AdGuard German filter',
    description: 'Filter description',
    version: '1.0.0.0',
    homepage: 'https://example.com',
    enabled: false,
    installed: true,
    loaded: true,
    disabledAsUnused: true,
    tags: [1],
    tagsDetails: [{
        tagId: 1,
        keyword: 'lang:de',
        description: 'German',
    }],
    ...overrides,
});

/**
 * Renders the filter card with a mocked root store.
 *
 * @param options Render options.
 * @param options.filter Filter data.
 * @param options.showUnusedStatus Value returned by the store status getter.
 *
 * @returns Render result.
 */
const renderFilter = async ({
    filter,
    showUnusedStatus,
}: {
    filter: any;
    showUnusedStatus: boolean;
}) => {
    const settingsStore = {
        updateFilterSetting: vi.fn(),
        shouldDisplayUnusedStatus: vi.fn(() => showUnusedStatus),
        setFilterEnabledState: vi.fn(),
    };

    const store = {
        settingsStore,
        uiStore: {
            setShowLoader: vi.fn(),
            addRuleLimitsNotification: vi.fn(),
        },
    };

    vi.doMock('../../../../../../../Extension/src/pages/options/stores/RootStore', () => ({
        rootStore: createContext(store),
    }));

    const { Filter } = await import(
        '../../../../../../../Extension/src/pages/options/components/Filters/Filter/Filter'
    );

    return render(React.createElement(Filter, { filter, groupEnabled: true }));
};

describe('Filter unused status', () => {
    beforeEach(() => {
        vi.resetModules();
    });

    afterEach(() => {
        cleanup();
        vi.restoreAllMocks();
    });

    describe.skipIf(__IS_MV3__)('MV2', () => {
        it('renders the status below the tags when it should be displayed', async () => {
            await renderFilter({ filter: createFilter(), showUnusedStatus: true });

            const status = screen.getByText(UNUSED_STATUS_KEY);
            const tags = screen.getByLabelText('options_filters_filter_tags');

            expect(status).toBeTruthy();
            expect(
                Array.from(tags.parentElement?.children || []).indexOf(status),
            ).toBeGreaterThan(
                Array.from(tags.parentElement?.children || []).indexOf(tags),
            );
        });

        it('does not render the status when it should not be displayed', async () => {
            await renderFilter({ filter: createFilter(), showUnusedStatus: false });

            expect(screen.queryByText(UNUSED_STATUS_KEY)).toBeNull();
        });
    });

    it.skipIf(!__IS_MV3__)('does not render the status in MV3', async () => {
        await renderFilter({ filter: createFilter(), showUnusedStatus: true });

        expect(screen.queryByText(UNUSED_STATUS_KEY)).toBeNull();
    });
});
