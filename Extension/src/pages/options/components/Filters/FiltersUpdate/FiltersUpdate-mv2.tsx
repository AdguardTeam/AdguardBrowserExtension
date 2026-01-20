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

import { translator } from '../../../../../common/translators/translator';
import { rootStore } from '../../../stores/RootStore';
import { formatDate } from '../helpers';

import styles from './filters-update.module.pcss';

export const FiltersUpdate = observer(() => {
    const { settingsStore } = useContext(rootStore);

    const {
        rulesCount,
        latestCheckTime,
        filtersUpdating,
        isUpdateFiltersButtonActive,
    } = settingsStore;

    const updateClickHandler = async () => {
        await settingsStore.updateFilters();
    };

    return (
        <div className={styles.filtersUpdate}>
            <div className={styles.info}>
                <div>
                    {translator.getMessage('options_antibanner_rules_count', { rules_count: rulesCount })}
                </div>
                <div>
                    {translator.getMessage('options_antibanner_updated', { date: formatDate(latestCheckTime) })}
                </div>
            </div>
            <button
                type="button"
                onClick={updateClickHandler}
                className={`button button--m button--transparent ${styles.updateBtn}`}
                title={translator.getMessage('options_update_antibanner_filters')}
                disabled={!isUpdateFiltersButtonActive || filtersUpdating}
            >
                {filtersUpdating
                    ? translator.getMessage('options_check_update_progress')
                    : translator.getMessage('update_check')}
            </button>
        </div>
    );
});
