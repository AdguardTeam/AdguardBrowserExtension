import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import cn from 'classnames';

import { reactTranslator } from '../../../../../common/translators/reactTranslator';
import { Icon } from '../../../../common/components/ui/Icon';
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
    const { settingsStore, uiStore } = useContext(rootStore);

    const {
        rulesCount,
        lastUpdateTime,
        filtersUpdating,
    } = settingsStore;

    const updateClickHandler = async () => {
        try {
            const updates = await settingsStore.updateFilters();
            const filterNames = updates.map((filter) => filter.name).join(', ');
            let description;
            if (updates.length === 0) {
                description = `${filterNames} ${reactTranslator.getMessage('options_popup_update_not_found')}`;
            } else if (updates.length === 1) {
                description = `${filterNames} ${reactTranslator.getMessage('options_popup_update_filter')}`;
            } else if (updates.length > 1) {
                description = `${filterNames} ${reactTranslator.getMessage('options_popup_update_filters')}`;
            }
            uiStore.addNotification({ description });
        } catch (error) {
            uiStore.addNotification({
                title: reactTranslator.getMessage('options_popup_update_title_error'),
                description: reactTranslator.getMessage('options_popup_update_error'),
            });
        }
    };

    const dateObj = new Date(lastUpdateTime);

    const buttonClass = cn(
        'button filters-update__btn',
        { 'filters-update__btn--loading': filtersUpdating },
        { 'filters-update__btn--loaded': !filtersUpdating },
    );

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
                className={buttonClass}
                title={reactTranslator.getMessage('options_update_antibanner_filters')}
            >
                <Icon id="#reload" classname="icon--reload" />
            </button>
        </div>
    );
});

export { FiltersUpdate };
