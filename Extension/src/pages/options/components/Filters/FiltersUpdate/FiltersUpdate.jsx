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
