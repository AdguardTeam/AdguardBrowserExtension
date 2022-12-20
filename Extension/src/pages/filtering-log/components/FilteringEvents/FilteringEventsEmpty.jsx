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

import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { Icon } from '../../../common/components/ui/Icon';
import { reactTranslator } from '../../../../common/translators/reactTranslator';
import { rootStore } from '../../stores/RootStore';

export const FilteringEventsEmpty = observer(() => {
    const { logStore } = useContext(rootStore);

    if (logStore.events.length > 0) {
        return null;
    }

    const resetFilters = async () => {
        await logStore.resetAllFilters();
    };

    const refreshPage = async () => {
        await logStore.refreshPage();
    };

    return (
        <div className="filtering-log__empty">
            <div className="filtering-log__empty-in">
                <Icon id="#magnifying" classname="filtering-log__empty-img" />
                <div className="filtering-log__desc">
                    {reactTranslator.getMessage(
                        'filtering_table_empty_reload_page_desc',
                        {
                            reset: (chunks) => (
                                <button
                                    className="filtering-log__refresh"
                                    type="button"
                                    onClick={resetFilters}
                                >
                                    {chunks}
                                </button>
                            ),
                            refresh: (chunks) => (
                                <button
                                    className="filtering-log__refresh"
                                    type="button"
                                    onClick={refreshPage}
                                >
                                    {chunks}
                                </button>
                            ),
                        },
                    )}
                </div>
            </div>
        </div>
    );
});
