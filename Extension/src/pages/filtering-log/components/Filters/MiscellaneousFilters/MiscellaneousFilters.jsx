import React, { useContext, useState } from 'react';
import { observer } from 'mobx-react';
import classNames from 'classnames';

import { rootStore } from '../../../stores/RootStore';

import './miscellaneous-filters.pcss';

const MiscellaneousFilters = observer(() => {
    const [showPopup, setShowPopup] = useState(false);

    const { logStore } = useContext(rootStore);
    const {
        searchRegular,
        searchWhitelisted,
        searchBlocked,
        searchModified,
        searchUserFilter,
        searchThirdParty,
        searchFirstParty,
        searchFirstThirdParty,
    } = logStore.miscellaneousFilters;

    const filtersCheckboxHandler = (filter) => (e) => {
        logStore.setMiscellaneousFilterValue(filter, e.target.checked);
    };

    const filtersRadioButtonHandler = (filter) => () => {
        logStore.setMiscellaneousFilterValue('searchFirstThirdParty', filter === 'searchFirstThirdParty');
        logStore.setMiscellaneousFilterValue('searchFirstParty', filter === 'searchFirstParty');
        logStore.setMiscellaneousFilterValue('searchThirdParty', filter === 'searchThirdParty');
    };

    const hidePopup = (event) => {
        if (!document.querySelector('.miscellaneous-filters__filters').contains(event.target)) {
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

    const filtersClassNames = (name, value) => classNames(
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
                Filters
            </button>
            <div className={filtersClassNames('miscellaneous-filters__filters', showPopup)}>
                <div className="miscellaneous-filters__section">
                    <label className="checkbox-label" htmlFor="regular">
                        <input
                            type="checkbox"
                            id="regular"
                            name="regular"
                            onClick={filtersCheckboxHandler('searchRegular')}
                            value={searchRegular}
                        />
                        <div className={filtersClassNames('custom-checkbox', searchRegular)} />
                        Regular
                    </label>

                    <label className="checkbox-label" htmlFor="whitelisted">
                        <input
                            type="checkbox"
                            id="whitelisted"
                            name="whitelisted"
                            onClick={filtersCheckboxHandler('searchWhitelisted')}
                            value={searchWhitelisted}
                        />
                        <div className={filtersClassNames('custom-checkbox', searchWhitelisted)} />
                        Whitelisted
                    </label>

                    <label className="checkbox-label" htmlFor="blocked">
                        <input
                            type="checkbox"
                            id="blocked"
                            name="blocked"
                            onClick={filtersCheckboxHandler('searchBlocked')}
                            value={searchBlocked}
                        />
                        <div className={filtersClassNames('custom-checkbox', searchBlocked)} />
                        Blocked
                    </label>

                    <label className="checkbox-label" htmlFor="modified">
                        <input
                            type="checkbox"
                            id="modified"
                            name="modified"
                            onClick={filtersCheckboxHandler('searchModified')}
                            value={searchModified}
                        />
                        <div className={filtersClassNames('custom-checkbox', searchModified)} />
                        Modified
                    </label>

                    <label className="checkbox-label" htmlFor="user-filter">
                        <input
                            type="checkbox"
                            id="user-filter"
                            name="user-filter"
                            onClick={filtersCheckboxHandler('searchUserFilter')}
                            value={searchUserFilter}
                        />
                        <div className={filtersClassNames('custom-checkbox', searchUserFilter)} />
                        User filter
                    </label>
                </div>

                <div className="hr" />

                <div className="miscellaneous-filters__section">
                    <label className="radio-button-label" htmlFor="first-third-party">
                        <input
                            type="radio"
                            id="first-third-party"
                            name="first-third-party"
                            onClick={filtersRadioButtonHandler('searchFirstThirdParty')}
                            value={searchFirstThirdParty}
                        />
                        <div className={filtersClassNames('radio-button', searchFirstThirdParty)} />
                        All
                    </label>

                    <label className="radio-button-label" htmlFor="third-party">
                        <input
                            type="radio"
                            id="third-party"
                            name="first-third-party"
                            onClick={filtersRadioButtonHandler('searchThirdParty')}
                            value={searchThirdParty}
                        />
                        <div className={filtersClassNames('radio-button', searchThirdParty)} />
                        Third party
                    </label>

                    <label className="radio-button-label" htmlFor="first-party">
                        <input
                            type="radio"
                            id="first-party"
                            name="first-third-party"
                            onClick={filtersRadioButtonHandler('searchFirstParty')}
                            value={searchFirstParty}
                        />
                        <div className={filtersClassNames('radio-button', searchFirstParty)} />
                        First party
                    </label>
                </div>
            </div>
        </div>
    );
});

export { MiscellaneousFilters };
