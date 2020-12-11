import React, { useContext, useState, useRef } from 'react';
import { observer } from 'mobx-react';
import cn from 'classnames';

import { Icon } from '../../../../common/components/ui/Icon';
import { rootStore } from '../../../stores/RootStore';
import { reactTranslator } from '../../../../reactCommon/reactTranslator';

import './miscellaneous-filters.pcss';

const MiscellaneousFilters = observer(() => {
    const [showPopup, setShowPopup] = useState(false);

    const ref = useRef(null);

    const { logStore } = useContext(rootStore);
    const {
        searchRegular,
        searchWhitelisted,
        searchBlocked,
        searchModified,
        searchUserFilter,
        searchParty,
    } = logStore.miscellaneousFilters;

    const {
        SEARCH_FIRST_PARTY,
        SEARCH_THIRD_PARTY,
        SEARCH_ALL,
    } = logStore.searchPartyFilter;

    const filtersCheckboxHandler = (filter) => (e) => {
        logStore.setMiscellaneousFilterValue(filter, e.target.checked);
    };

    const radioHandler = (e) => {
        logStore.setMiscellaneousFilterValue('searchParty', e.target.value);
    };

    const hidePopup = (event) => {
        if (ref.current && !ref.current.contains(event.target)) {
            setShowPopup(false);
            document.removeEventListener('click', hidePopup);
        }
    };

    const miscellaneousFiltersButtonHandler = () => {
        if (!showPopup) {
            setShowPopup(true);
            document.addEventListener('click', hidePopup);
        }
    };

    const filtersClassNames = (name, value) => cn(
        name,
        { active: value },
    );

    return (
        <div className="miscellaneous-filters">
            <button
                className="miscellaneous-filters__button"
                type="button"
                onClick={miscellaneousFiltersButtonHandler}
            >
                <Icon id="#filters" classname="icon--filters miscellaneous-filters__filters-ico" />
                {reactTranslator.translate('filtering_log_filter_title')}
                <Icon id="#select" classname="icon--select miscellaneous-filters__select-ico" />
            </button>
            <div className={filtersClassNames('miscellaneous-filters__filters', showPopup)} ref={ref}>
                <div className="miscellaneous-filters__section">
                    <label className="checkbox-label" htmlFor="regular">
                        <input
                            type="checkbox"
                            id="regular"
                            name="regular"
                            onClick={filtersCheckboxHandler('searchRegular')}
                            value={searchRegular}
                            checked={searchRegular}
                        />
                        <div className="custom-checkbox">
                            <Icon id="#checked" classname="icon--checked" />
                        </div>
                        {reactTranslator.translate('filtering_log_filter_regular')}
                    </label>

                    <label className="checkbox-label" htmlFor="whitelisted">
                        <input
                            type="checkbox"
                            id="whitelisted"
                            name="whitelisted"
                            onClick={filtersCheckboxHandler('searchWhitelisted')}
                            value={searchWhitelisted}
                            checked={searchWhitelisted}
                        />
                        <div className="custom-checkbox">
                            <Icon id="#checked" classname="icon--checked" />
                        </div>
                        {reactTranslator.translate('filtering_log_filter_allowlisted')}
                    </label>

                    <label className="checkbox-label" htmlFor="blocked">
                        <input
                            type="checkbox"
                            id="blocked"
                            name="blocked"
                            onClick={filtersCheckboxHandler('searchBlocked')}
                            value={searchBlocked}
                            checked={searchBlocked}
                        />
                        <div className="custom-checkbox">
                            <Icon id="#checked" classname="icon--checked" />
                        </div>
                        {reactTranslator.translate('filtering_log_filter_blocked')}
                    </label>

                    <label className="checkbox-label" htmlFor="modified">
                        <input
                            type="checkbox"
                            id="modified"
                            name="modified"
                            onClick={filtersCheckboxHandler('searchModified')}
                            value={searchModified}
                            checked={searchModified}
                        />
                        <div className="custom-checkbox">
                            <Icon id="#checked" classname="icon--checked" />
                        </div>
                        {reactTranslator.translate('filtering_log_filter_modified')}
                    </label>

                    <label className="checkbox-label" htmlFor="user-filter">
                        <input
                            type="checkbox"
                            id="user-filter"
                            name="user-filter"
                            onClick={filtersCheckboxHandler('searchUserFilter')}
                            value={searchUserFilter}
                            checked={searchUserFilter}
                        />
                        <div className="custom-checkbox">
                            <Icon id="#checked" classname="icon--checked" />
                        </div>
                        {reactTranslator.translate('filtering_log_filter_user_rule')}
                    </label>
                </div>

                <div className="hrow" />

                <div className="miscellaneous-filters__section">
                    <label className="radio-button-label" htmlFor="first-third-party">
                        <input
                            type="radio"
                            id="first-third-party"
                            name="party-filter"
                            onClick={radioHandler}
                            value={SEARCH_ALL}
                            checked={searchParty === SEARCH_ALL}
                        />
                        <div className="radio-button" />
                        {reactTranslator.translate('filtering_log_filter_all')}
                    </label>

                    <label className="radio-button-label" htmlFor="first-party">
                        <input
                            type="radio"
                            id="first-party"
                            name="party-filter"
                            onClick={radioHandler}
                            value={SEARCH_FIRST_PARTY}
                            checked={searchParty === SEARCH_FIRST_PARTY}
                        />
                        <div className="radio-button" />
                        {reactTranslator.translate('filtering_log_filter_first_party')}
                    </label>

                    <label className="radio-button-label" htmlFor="third-party">
                        <input
                            type="radio"
                            id="third-party"
                            name="party-filter"
                            onClick={radioHandler}
                            value={SEARCH_THIRD_PARTY}
                            checked={searchParty === SEARCH_THIRD_PARTY}
                        />
                        <div className="radio-button" />
                        {reactTranslator.translate('filtering_log_filter_third_party')}
                    </label>
                </div>
            </div>
        </div>
    );
});

export { MiscellaneousFilters };
