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

import { rootStore } from '../../../stores/RootStore';
import { translator } from '../../../../../common/translators/translator';
import { Icon } from '../../../../common/components/ui/Icon';

import styles from './UpdateButtonMobile.module.pcss';

export const UpdateButtonMobile = observer(() => {
    const { settingsStore } = useContext(rootStore);
    const {
        filtersUpdating,
        isUpdateFiltersButtonActive,
    } = settingsStore;

    const handleUpdateFilters = async () => {
        if (!isUpdateFiltersButtonActive || filtersUpdating) {
            return;
        }

        await settingsStore.updateFilters();
    };

    return (
        <button
            type="button"
            className={styles.mobileUpdateBtn}
            onClick={handleUpdateFilters}
            title={translator.getMessage('options_update_antibanner_filters')}
            aria-label={translator.getMessage('options_update_antibanner_filters')}
            disabled={!isUpdateFiltersButtonActive || filtersUpdating}
        >
            <Icon
                id="#reload"
                className="icon--24 icon--green-default"
                animationCondition={filtersUpdating}
                animationClassName="icon--loading"
                aria-hidden="true"
            />
        </button>
    );
});
