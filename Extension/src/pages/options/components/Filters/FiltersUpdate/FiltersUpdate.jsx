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

import { reactTranslator } from '../../../../../common/translators/reactTranslator';
import { rootStore } from '../../../stores/RootStore';

import './filters-update.pcss';

const formatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
};

const FiltersUpdate = observer(() => {
    const { settingsStore } = useContext(rootStore);

    const {
        rulesCount,
        lastUpdateTime,
        filtersUpdating,
        isUpdateFiltersButtonActive,
    } = settingsStore;

    const updateClickHandler = async () => {
        await settingsStore.updateFilters();
    };

    const dateObj = new Date(lastUpdateTime);

    return (
        <div className="filters-update">
            <div className="filters-update__info">
                <div className="filters-update__title">
                    {reactTranslator.getMessage('options_antibanner_rules_count', { rules_count: rulesCount })}
                </div>
                <div className="filters-update__desc">
                    {dateObj.toLocaleDateString('default', formatOptions)}
                </div>
            </div>
            <button
                type="button"
                onClick={updateClickHandler}
                className="button button--m button--transparent filters-update__btn"
                title={reactTranslator.getMessage('options_update_antibanner_filters')}
                disabled={!isUpdateFiltersButtonActive || filtersUpdating}
            >
                {filtersUpdating
                    ? reactTranslator.getMessage('options_check_update_progress')
                    : reactTranslator.getMessage('options_check_update')}
            </button>
        </div>
    );
});

export { FiltersUpdate };
